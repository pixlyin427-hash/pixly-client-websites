-- Crème & Crust — counter billing (POS), daily sales records and audited deletion

create or replace function public.create_counter_bill(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.shop_settings; v_ref uuid := _uuid(p->>'client_ref'); v_existing uuid;
  v_name text := coalesce(nullif(btrim(coalesce(p->>'customer_name', '')), ''), 'Walk-in customer');
  v_phone text := regexp_replace(coalesce(p->>'phone', ''), '\D', '', 'g');
  v_pay text := coalesce(p->>'payment_method', '');
  v_kitchen boolean := coalesce((p->>'send_to_kitchen')::boolean, false);
  v_apply_tax boolean := coalesce((p->>'apply_tax')::boolean, true);
  v_dtype text := coalesce(nullif(p->>'discount_type', ''), 'none');
  v_dval numeric; v_taxp numeric; v_no text; v_label text;
  v_order_id uuid; v_item jsonb; v_prod record; g record; v_qty int; v_opt_ids uuid[]; v_raw int; v_valid int; v_opt_total int;
  v_unit int; v_line int; v_sub int := 0; v_disc int := 0; v_tax int; v_pos int := 0; v_item_id uuid; v_iname text; v_iprice int; v_is_prod boolean;
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  select * into s from shop_settings where id = 1;
  if v_ref is not null then
    select id into v_existing from orders where client_ref = v_ref;
    if found then return _order_json(v_existing, true) || jsonb_build_object('duplicate', true); end if;
  end if;
  if length(v_name) > 60 then raise exception 'Customer name is too long.'; end if;
  if v_phone <> '' then
    if length(v_phone) = 12 and left(v_phone, 2) = '91' then v_phone := right(v_phone, 10); end if;
    if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a valid 10-digit mobile number, or leave it empty.'; end if;
  end if;
  if v_pay not in ('cash', 'upi', 'other') and not exists (select 1 from jsonb_array_elements(s.payment_methods) m
       where m->>'key' = v_pay and coalesce((m->>'enabled')::boolean, false)) then
    raise exception 'Choose a payment method.';
  end if;
  if coalesce(jsonb_typeof(p->'items'), '') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'Add at least one item to the bill.'; end if;
  if jsonb_array_length(p->'items') > 60 then raise exception 'Too many lines on one bill.'; end if;
  begin v_dval := coalesce(nullif(p->>'discount_value', '')::numeric, 0); exception when others then raise exception 'Enter a valid discount.'; end;
  if v_dtype not in ('none', 'percent', 'fixed') or v_dval < 0 then raise exception 'Enter a valid discount.'; end if;
  if v_dtype = 'percent' and v_dval > 100 then raise exception 'A percentage discount must be between 0 and 100.'; end if;

  insert into orders (order_number, client_ref, customer_name, phone, order_type, notes, payment_method, payment_status, status,
                      tax_percent, is_demo, source, created_by, accepted_at, completed_at)
  values (_new_order_number(), v_ref, v_name, v_phone, case when p->>'order_type' = 'dine_in' then 'dine_in' else 'takeaway' end,
          left(btrim(coalesce(p->>'notes', '')), 500), v_pay, 'paid', case when v_kitchen then 'accepted' else 'completed' end,
          0, s.demo_mode, 'counter', auth.uid(), now(), case when v_kitchen then null else now() end)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p->'items') loop
    v_pos := v_pos + 1;
    begin v_qty := (v_item->>'quantity')::int; exception when others then v_qty := null; end;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'Each quantity must be between 1 and 99.'; end if;
    v_opt_ids := '{}'; v_opt_total := 0; v_is_prod := coalesce(v_item->>'product_id', '') <> '';
    if v_is_prod then
      select pr.id, pr.name, pr.price_paise, pr.is_customizable, pr.is_available, c.name as cat into v_prod
        from products pr join categories c on c.id = pr.category_id where pr.id = _uuid(v_item->>'product_id');
      if not found then raise exception 'A product on this bill no longer exists. Remove it and try again.'; end if;
      if not v_prod.is_available then raise exception '% is marked sold out. Turn it back on in Products to bill it.', v_prod.name; end if;
      v_raw := coalesce(jsonb_array_length(case when jsonb_typeof(v_item->'option_ids') = 'array' then v_item->'option_ids' end), 0);
      select coalesce(array_agg(distinct u), '{}') into v_opt_ids
        from (select _uuid(x) u from jsonb_array_elements_text(coalesce(case when jsonb_typeof(v_item->'option_ids') = 'array' then v_item->'option_ids' end, '[]'::jsonb)) x) t
       where u is not null;
      if cardinality(v_opt_ids) <> v_raw then raise exception 'Some add-ons for % are not valid.', v_prod.name; end if;
      if cardinality(v_opt_ids) > 0 then
        select count(*) into v_valid from options o join product_option_groups pog on pog.group_id = o.group_id and pog.product_id = v_prod.id
         where o.id = any(v_opt_ids) and o.is_active;
        if not v_prod.is_customizable or v_valid <> cardinality(v_opt_ids) then raise exception 'Some add-ons for % are no longer available.', v_prod.name; end if;
        for g in select og.name, og.selection, og.max_select, count(*) n from options o join option_groups og on og.id = o.group_id
                  where o.id = any(v_opt_ids) group by og.id, og.name, og.selection, og.max_select loop
          if (g.selection = 'single' and g.n > 1) or (g.max_select > 0 and g.n > g.max_select) then
            raise exception 'Too many choices in "%" for %.', g.name, v_prod.name;
          end if;
        end loop;
      end if;
      if v_prod.is_customizable then
        for g in select og.name from product_option_groups pog join option_groups og on og.id = pog.group_id
                  where pog.product_id = v_prod.id and og.required
                    and not exists (select 1 from options o where o.group_id = og.id and o.id = any(v_opt_ids)) loop
          raise exception 'Please choose "%" for %.', g.name, v_prod.name;
        end loop;
      end if;
      select coalesce(sum(price_paise), 0) into v_opt_total from options where id = any(v_opt_ids);
      v_iname := v_prod.name; v_iprice := v_prod.price_paise;
    else
      v_iname := btrim(coalesce(v_item->>'name', ''));
      if length(v_iname) < 1 or length(v_iname) > 60 then raise exception 'Give each custom item a name (up to 60 characters).'; end if;
      begin v_iprice := (v_item->>'unit_price_paise')::int; exception when others then v_iprice := null; end;
      if v_iprice is null or v_iprice < 0 or v_iprice > 10000000 then raise exception 'Enter a valid price for %.', v_iname; end if;
    end if;
    v_unit := v_iprice + v_opt_total; v_line := v_unit * v_qty; v_sub := v_sub + v_line;
    insert into order_items (order_id, product_id, product_name, category_name, base_price_paise, options_price_paise,
                             unit_price_paise, quantity, line_total_paise, notes, position)
    values (v_order_id, case when v_is_prod then v_prod.id end, v_iname, case when v_is_prod then v_prod.cat else 'Custom item' end,
            v_iprice, v_opt_total, v_unit, v_qty, v_line, left(btrim(coalesce(v_item->>'notes', '')), 200), v_pos)
    returning id into v_item_id;
    if cardinality(v_opt_ids) > 0 then
      insert into order_item_options (order_item_id, option_id, group_name, option_name, price_paise)
      select v_item_id, o.id, og.name, o.name, o.price_paise from options o join option_groups og on og.id = o.group_id
       where o.id = any(v_opt_ids) order by og.sort_order, o.sort_order;
    end if;
  end loop;

  if v_dtype = 'percent' then
    v_disc := floor(v_sub * v_dval / 100); v_label := to_char(v_dval, 'FM990.##') || '%';
    v_label := rtrim(v_label, '.');
  elsif v_dtype = 'fixed' then
    v_disc := round(v_dval);
    if v_disc > v_sub then raise exception 'The discount can’t be more than the subtotal (%).', _inr(v_sub); end if;
    v_label := 'Flat ' || _inr(v_disc);
  end if;
  v_taxp := case when v_apply_tax then s.tax_percent else 0 end;
  v_tax := round((v_sub - v_disc)::numeric * v_taxp / 100);
  v_no := _bill_no();
  update orders set subtotal_paise = v_sub, discount_paise = v_disc, tax_paise = v_tax, total_paise = v_sub - v_disc + v_tax,
         tax_percent = v_taxp, discount_label = case when v_disc > 0 then v_label end, receipt_no = v_no
   where id = v_order_id;
  insert into order_status_history (order_id, from_status, to_status, note, changed_by) values
    (v_order_id, null, 'new', 'Counter bill ' || v_no, auth.uid()),
    (v_order_id, 'new', case when v_kitchen then 'accepted' else 'completed' end, 'Paid at counter', auth.uid());
  if not v_kitchen then perform _deduct_inventory(v_order_id); end if;
  return _order_json(v_order_id, true);
end $$;

-- daily records in shop time (IST). A sale counts once it is paid or completed; cancelled orders never count.
create or replace function public.sales_by_day(p_from date, p_to date)
returns table(day date, bills int, gross bigint, discounts bigint, tax bigint, revenue bigint, cash bigint, upi bigint, other bigint,
              counter_bills int, online_bills int, demo_bills int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then raise exception 'Choose a date range of up to 400 days.'; end if;
  return query
  select d::date, count(o.id)::int, coalesce(sum(o.subtotal_paise), 0)::bigint, coalesce(sum(o.discount_paise), 0)::bigint,
         coalesce(sum(o.tax_paise), 0)::bigint, coalesce(sum(o.total_paise), 0)::bigint,
         coalesce(sum(o.total_paise) filter (where o.payment_method = 'cash'), 0)::bigint,
         coalesce(sum(o.total_paise) filter (where o.payment_method = 'upi'), 0)::bigint,
         coalesce(sum(o.total_paise) filter (where o.payment_method not in ('cash', 'upi')), 0)::bigint,
         (count(o.id) filter (where o.source = 'counter'))::int, (count(o.id) filter (where o.source = 'online'))::int,
         (count(o.id) filter (where o.is_demo))::int
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
    left join orders o on (o.created_at at time zone 'Asia/Kolkata')::date = d::date
                      and o.status <> 'cancelled' and (o.payment_status = 'paid' or o.status = 'completed')
   group by d order by d;
end $$;

create or replace function public.delete_order_permanently(p_order_id uuid, p_confirm text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not is_owner() then raise exception 'Only the owner can permanently delete a bill.' using errcode = '42501'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Bill not found.'; end if;
  if btrim(coalesce(p_confirm, '')) <> coalesce(o.receipt_no, o.order_number) then raise exception 'Type the bill number exactly to confirm.'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason for deleting this bill.'; end if;
  insert into deleted_bills_log (order_number, receipt_no, total_paise, snapshot, reason, deleted_by)
  values (o.order_number, o.receipt_no, o.total_paise, _order_json(o.id, true), btrim(p_reason), auth.uid());
  delete from orders where id = o.id;
  return jsonb_build_object('deleted', coalesce(o.receipt_no, o.order_number));
end $$;

revoke execute on function public.create_counter_bill(jsonb), public.sales_by_day(date, date),
  public.delete_order_permanently(uuid, text, text) from public, anon;
grant execute on function public.create_counter_bill(jsonb), public.sales_by_day(date, date),
  public.delete_order_permanently(uuid, text, text) to authenticated;
