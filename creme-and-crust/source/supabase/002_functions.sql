-- Crème & Crust — server-side business logic (all pricing, discounts and status rules live here)

create or replace function public._uuid(t text) returns uuid
language plpgsql immutable set search_path = public as $$
begin return t::uuid; exception when others then return null; end $$;

create or replace function public._inr(p int) returns text
language sql immutable set search_path = public as $$
  select '₹' || case when p % 100 = 0 then (p / 100)::text else to_char(p / 100.0, 'FM9999999990.00') end
$$;

create or replace function public._new_order_number() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare v text; n int := 0;
begin
  loop
    select 'CC-' || string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 31), 1), '')
      into v from (select gen_random_bytes(6) b) x, generate_series(0, 5) i;
    exit when not exists (select 1 from orders where order_number = v);
    n := n + 1; if n > 20 then raise exception 'Could not create an order number. Please try again.'; end if;
  end loop;
  return v;
end $$;

create or replace function public._bill_no() returns text
language sql volatile set search_path = public as $$ select 'B' || nextval('receipt_seq') $$;

-- ───────── coupon evaluation (shared by preview + checkout) ─────────
create or replace function public._coupon_eval(c public.coupons, p_subtotal int) returns jsonb
language plpgsql stable set search_path = public as $$
declare d int;
begin
  if c.id is null then return jsonb_build_object('ok', false, 'message', 'This coupon code is not valid.'); end if;
  if not c.is_active then return jsonb_build_object('ok', false, 'message', 'This coupon is not active.'); end if;
  if c.starts_at is not null and now() < c.starts_at then return jsonb_build_object('ok', false, 'message', 'This coupon is not active yet.'); end if;
  if c.expires_at is not null and now() >= c.expires_at then return jsonb_build_object('ok', false, 'message', 'This coupon has expired.'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('ok', false, 'message', 'This coupon has reached its usage limit.'); end if;
  if p_subtotal < c.min_order_paise then
    return jsonb_build_object('ok', false, 'message', 'Add ' || _inr(c.min_order_paise - p_subtotal) || ' more to use ' || c.code || ' (minimum order ' || _inr(c.min_order_paise) || ').');
  end if;
  if c.discount_type = 'percent' then d := floor(p_subtotal::numeric * c.discount_value / 100); else d := c.discount_value; end if;
  if c.max_discount_paise is not null then d := least(d, c.max_discount_paise); end if;
  d := greatest(least(d, p_subtotal), 0);
  return jsonb_build_object('ok', true, 'code', c.code, 'title', c.title, 'discount_paise', d,
    'discount_type', c.discount_type, 'discount_value', c.discount_value, 'max_discount_paise', c.max_discount_paise,
    'message', c.code || ' applied — you save ' || _inr(d) || '.');
end $$;

create or replace function public.validate_coupon(p_code text, p_subtotal_paise int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from coupons where code = upper(btrim(coalesce(p_code, '')));
  return _coupon_eval(c, greatest(coalesce(p_subtotal_paise, 0), 0));
end $$;

-- offers that the owner chose to show on the website
create or replace function public.get_site_offers() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', code, 'title', title, 'description', description,
    'discount_type', discount_type, 'discount_value', discount_value, 'max_discount_paise', max_discount_paise,
    'min_order_paise', min_order_paise, 'expires_at', expires_at) order by created_at), '[]'::jsonb)
  from coupons
  where is_active and show_on_site and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now()) and (usage_limit is null or used_count < usage_limit)
$$;

-- ───────── order JSON (public view masks the phone and hides ids) ─────────
create or replace function public._order_json(p_id uuid, p_staff boolean) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', case when p_staff then o.id end,
    'order_number', o.order_number, 'customer_name', o.customer_name,
    'phone', case when p_staff then o.phone else '••••••' || right(o.phone, 4) end,
    'order_type', o.order_type, 'table_label', o.table_label, 'notes', o.notes,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'status', o.status,
    'subtotal_paise', o.subtotal_paise, 'discount_paise', o.discount_paise, 'tax_paise', o.tax_paise,
    'total_paise', o.total_paise, 'tax_percent', o.tax_percent, 'coupon_code', o.coupon_code,
    'cancel_reason', o.cancel_reason, 'is_demo', o.is_demo, 'receipt_no', o.receipt_no, 'source', o.source, 'discount_label', o.discount_label, 'created_at', o.created_at,
    'accepted_at', o.accepted_at, 'preparing_at', o.preparing_at, 'ready_at', o.ready_at,
    'completed_at', o.completed_at, 'cancelled_at', o.cancelled_at,
    'prep_minutes', (select prep_minutes from shop_settings where id = 1),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'name', i.product_name, 'quantity', i.quantity, 'unit_price_paise', i.unit_price_paise,
        'base_price_paise', i.base_price_paise, 'line_total_paise', i.line_total_paise, 'notes', i.notes,
        'options', coalesce((select jsonb_agg(jsonb_build_object('group', x.group_name, 'name', x.option_name, 'price_paise', x.price_paise))
                             from order_item_options x where x.order_item_id = i.id), '[]'::jsonb)
      ) order by i.position) from order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('to', h.to_status, 'at', h.created_at) order by h.created_at)
                         from order_status_history h where h.order_id = o.id), '[]'::jsonb)
  ) from orders o where o.id = p_id
$$;

-- ───────── place an order: everything is re-priced and validated here ─────────
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.shop_settings;
  v_name text := btrim(coalesce(p->>'customer_name', ''));
  v_phone text := regexp_replace(coalesce(p->>'phone', ''), '\D', '', 'g');
  v_type text := coalesce(p->>'order_type', '');
  v_pay text := coalesce(p->>'payment_method', '');
  v_notes text := left(btrim(coalesce(p->>'notes', '')), 500);
  v_table text := nullif(left(btrim(coalesce(p->>'table_label', '')), 20), '');
  v_ref uuid := _uuid(p->>'client_ref');
  v_order_id uuid; v_existing uuid; v_item jsonb; v_prod record; g record;
  v_qty int; v_opt_ids uuid[]; v_raw_count int; v_valid int; v_opt_total int; v_unit int; v_line int;
  v_subtotal int := 0; v_discount int := 0; v_tax int; v_pos int := 0; v_item_id uuid;
  v_coupon public.coupons; v_eval jsonb; v_code text := upper(btrim(coalesce(p->>'coupon_code', '')));
begin
  select * into s from shop_settings where id = 1;
  if not found then raise exception 'The shop is not set up yet.'; end if;
  if not s.ordering_enabled then raise exception 'We are not accepting online orders right now. Please order at the counter.'; end if;

  if v_ref is not null then
    select id into v_existing from orders where client_ref = v_ref;
    if found then return _order_json(v_existing, false) || jsonb_build_object('duplicate', true); end if;
  end if;

  if length(v_name) < 2 or length(v_name) > 60 then raise exception 'Please enter your name (2–60 characters).'; end if;
  if length(v_phone) = 12 and left(v_phone, 2) = '91' then v_phone := right(v_phone, 10); end if;
  if length(v_phone) = 11 and left(v_phone, 1) = '0' then v_phone := right(v_phone, 10); end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Please enter a valid 10-digit mobile number.'; end if;
  if v_type = 'takeaway' then
    if not s.takeaway_enabled then raise exception 'Takeaway is not available right now.'; end if;
  elsif v_type = 'dine_in' then
    if not s.dine_in_enabled then raise exception 'Dine-in is not available right now.'; end if;
  else raise exception 'Please choose takeaway or dine-in.'; end if;
  if not exists (select 1 from jsonb_array_elements(s.payment_methods) m
                 where m->>'key' = v_pay and coalesce((m->>'enabled')::boolean, false)) then
    raise exception 'Please choose an available payment method.';
  end if;
  if coalesce(jsonb_typeof(p->'items'), '') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'Your cart is empty.'; end if;
  if jsonb_array_length(p->'items') > 30 then raise exception 'That is a lot of waffles! Please split this into smaller orders.'; end if;
  if (select count(*) from orders where phone = v_phone and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Too many orders from this number in a few minutes. Please wait a little and try again.';
  end if;

  insert into orders (order_number, client_ref, customer_name, phone, order_type, table_label, notes, payment_method, tax_percent, is_demo)
  values (_new_order_number(), v_ref, v_name, v_phone, v_type, case when v_type = 'dine_in' then v_table end, v_notes, v_pay, s.tax_percent, s.demo_mode)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p->'items') loop
    v_pos := v_pos + 1;
    begin v_qty := (v_item->>'quantity')::int; exception when others then v_qty := null; end;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'Each item quantity must be between 1 and 20.'; end if;

    select pr.id, pr.name, pr.price_paise, pr.is_customizable, c.name as cat into v_prod
      from products pr join categories c on c.id = pr.category_id
     where pr.id = _uuid(v_item->>'product_id') and pr.is_available and c.is_active;
    if not found then raise exception 'One of the items in your cart is no longer available. Please review your cart.'; end if;

    if coalesce(jsonb_typeof(v_item->'option_ids'), 'null') not in ('array', 'null') then raise exception 'Invalid add-ons.'; end if;
    v_raw_count := coalesce(jsonb_array_length(case when jsonb_typeof(v_item->'option_ids') = 'array' then v_item->'option_ids' end), 0);
    select coalesce(array_agg(distinct u), '{}') into v_opt_ids
      from (select _uuid(x) u from jsonb_array_elements_text(coalesce(case when jsonb_typeof(v_item->'option_ids') = 'array' then v_item->'option_ids' end, '[]'::jsonb)) x) t
     where u is not null;
    if cardinality(v_opt_ids) <> v_raw_count then raise exception 'Some add-ons for % are not valid. Please customise it again.', v_prod.name; end if;

    if cardinality(v_opt_ids) > 0 then
      if not v_prod.is_customizable then raise exception '% cannot be customised.', v_prod.name; end if;
      select count(*) into v_valid from options o
        join product_option_groups pog on pog.group_id = o.group_id and pog.product_id = v_prod.id
       where o.id = any(v_opt_ids) and o.is_active;
      if v_valid <> cardinality(v_opt_ids) then raise exception 'Some add-ons for % are no longer available. Please customise it again.', v_prod.name; end if;
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
    v_unit := v_prod.price_paise + v_opt_total;
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;

    insert into order_items (order_id, product_id, product_name, category_name, base_price_paise, options_price_paise,
                             unit_price_paise, quantity, line_total_paise, notes, position)
    values (v_order_id, v_prod.id, v_prod.name, v_prod.cat, v_prod.price_paise, v_opt_total, v_unit, v_qty, v_line,
            left(btrim(coalesce(v_item->>'notes', '')), 200), v_pos)
    returning id into v_item_id;

    insert into order_item_options (order_item_id, option_id, group_name, option_name, price_paise)
    select v_item_id, o.id, og.name, o.name, o.price_paise
      from options o join option_groups og on og.id = o.group_id
     where o.id = any(v_opt_ids) order by og.sort_order, o.sort_order;
  end loop;

  if v_code <> '' then
    select * into v_coupon from coupons where code = v_code for update;
    v_eval := _coupon_eval(v_coupon, v_subtotal);
    if not (v_eval->>'ok')::boolean then raise exception '%', v_eval->>'message'; end if;
    v_discount := (v_eval->>'discount_paise')::int;
    update coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_tax := round((v_subtotal - v_discount)::numeric * s.tax_percent / 100);
  update orders set subtotal_paise = v_subtotal, discount_paise = v_discount, tax_paise = v_tax,
         total_paise = v_subtotal - v_discount + v_tax, coupon_id = v_coupon.id, coupon_code = nullif(v_code, '')
   where id = v_order_id;
  insert into order_status_history (order_id, from_status, to_status, note) values (v_order_id, null, 'new', 'Order placed online');
  return _order_json(v_order_id, false);
end $$;

-- customers look up an order with its number + the phone used to place it
create or replace function public.track_order(p_order_number text, p_phone text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10); v_id uuid;
begin
  if length(v_phone) <> 10 then return null; end if;
  select id into v_id from orders where order_number = upper(btrim(coalesce(p_order_number, ''))) and phone = v_phone;
  if v_id is null then return null; end if;
  return _order_json(v_id, false);
end $$;

-- ───────── inventory deduction (exactly once per order) ─────────
create or replace function public._deduct_inventory(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; r record; v_before numeric; v_after numeric;
begin
  select * into o from orders where id = p_order for update;
  if not found or o.inventory_deducted_at is not null then return; end if;
  for r in select pi.item_id, sum(pi.quantity * oi.quantity) as need
             from order_items oi join product_ingredients pi on pi.product_id = oi.product_id
            where oi.order_id = p_order group by pi.item_id loop
    select quantity into v_before from inventory_items where id = r.item_id for update;
    v_after := greatest(v_before - r.need, 0);
    update inventory_items set quantity = v_after where id = r.item_id;
    insert into inventory_transactions (item_id, change, quantity_after, reason, order_id, note, created_by)
    values (r.item_id, v_after - v_before, v_after, 'order', p_order, 'Order ' || o.order_number, auth.uid());
  end loop;
  update orders set inventory_deducted_at = now() where id = p_order;
end $$;

-- ───────── staff: move an order through the workflow ─────────
create or replace function public.update_order_status(p_order_id uuid, p_expected text, p_to text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders; allowed text[];
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.status <> p_expected then
    raise exception 'Order % was already moved to "%".', o.order_number, o.status using hint = 'stale';
  end if;
  allowed := case o.status
    when 'new' then array['accepted', 'cancelled'] when 'accepted' then array['preparing', 'cancelled']
    when 'preparing' then array['ready', 'cancelled'] when 'ready' then array['completed', 'cancelled']
    else array[]::text[] end;
  if not (p_to = any(allowed)) then raise exception 'An order that is "%" cannot be moved to "%".', o.status, p_to; end if;
  if p_to = 'cancelled' and o.status <> 'new' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Please give a reason for cancelling an order that was already accepted.';
  end if;
  update orders set status = p_to,
    accepted_at  = case when p_to = 'accepted'  then now() else accepted_at end,
    preparing_at = case when p_to = 'preparing' then now() else preparing_at end,
    ready_at     = case when p_to = 'ready'     then now() else ready_at end,
    completed_at = case when p_to = 'completed' then now() else completed_at end,
    cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end,
    cancel_reason = case when p_to = 'cancelled' then coalesce(nullif(btrim(p_note), ''), 'Rejected by the shop') else cancel_reason end,
    receipt_no = case when p_to = 'completed' and receipt_no is null then _bill_no() else receipt_no end
  where id = o.id;
  if p_to = 'cancelled' and o.coupon_id is not null then
    update coupons set used_count = greatest(used_count - 1, 0) where id = o.coupon_id;
  end if;
  if p_to = 'completed' then perform _deduct_inventory(o.id); end if;
  insert into order_status_history (order_id, from_status, to_status, note, changed_by)
  values (o.id, o.status, p_to, nullif(btrim(coalesce(p_note, '')), ''), auth.uid());
  return jsonb_build_object('id', o.id, 'status', p_to);
end $$;

create or replace function public.set_payment_status(p_order_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if p_status not in ('unpaid', 'paid', 'refunded') then raise exception 'Unknown payment status.'; end if;
  if p_status = 'refunded' and not (o.payment_status = 'paid' and o.status = 'cancelled') then
    raise exception 'Only a paid order that was cancelled can be marked refunded.';
  end if;
  if p_status = 'paid' and o.status = 'cancelled' then raise exception 'This order is cancelled.'; end if;
  if o.payment_status = p_status then return jsonb_build_object('id', o.id, 'payment_status', p_status); end if;
  update orders set payment_status = p_status,
    receipt_no = case when p_status = 'paid' and receipt_no is null then _bill_no() else receipt_no end where id = o.id;
  insert into order_status_history (order_id, from_status, to_status, note, changed_by)
  values (o.id, o.status, o.status, 'Payment marked ' || p_status, auth.uid());
  return jsonb_build_object('id', o.id, 'payment_status', p_status);
end $$;

-- ───────── receipts ─────────
create or replace function public.record_receipt_print(p_order_id uuid, p_method text, p_status text, p_paper text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders; v_no text; v_kind text;
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  if p_method not in ('browser', 'simulated', 'serial', 'bluetooth') or p_status not in ('sent_to_browser', 'simulated', 'printed', 'failed')
     or p_paper not in ('58', '80') then raise exception 'Invalid print details.'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  v_no := o.receipt_no;
  if v_no is null then
    v_no := _bill_no();
    update orders set receipt_no = v_no where id = o.id;
  end if;
  v_kind := case when exists (select 1 from receipts where order_id = o.id and status <> 'failed') then 'reprint' else 'original' end;
  insert into receipts (order_id, receipt_no, kind, method, status, paper, printed_by)
  values (o.id, v_no, v_kind, p_method, p_status, p_paper, auth.uid());
  return jsonb_build_object('receipt_no', v_no, 'kind', v_kind,
    'print_count', (select count(*) from receipts where order_id = o.id and status <> 'failed'));
end $$;

-- receipt numbers are assigned before the first print so the slip can show it
create or replace function public.assign_receipt_no(p_order_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_no text;
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  select receipt_no into v_no from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_no is null then
    v_no := _bill_no();
    update orders set receipt_no = v_no where id = p_order_id;
  end if;
  return v_no;
end $$;

-- ───────── inventory adjustments ─────────
create or replace function public.adjust_inventory(p_item_id uuid, p_mode text, p_amount numeric, p_reason text default null, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_before numeric; v_after numeric; v_reason text;
begin
  if not is_staff() then raise exception 'You are not allowed to do this.' using errcode = '42501'; end if;
  if p_amount is null or p_amount < 0 or p_amount > 1000000 then raise exception 'Enter a valid amount.'; end if;
  select quantity into v_before from inventory_items where id = p_item_id for update;
  if not found then raise exception 'Item not found.'; end if;
  if p_mode = 'add' then v_after := v_before + p_amount; v_reason := 'restock';
  elsif p_mode = 'remove' then v_after := v_before - p_amount; v_reason := case when p_reason = 'waste' then 'waste' else 'usage' end;
  elsif p_mode = 'set' then v_after := p_amount; v_reason := 'count';
  else raise exception 'Unknown adjustment.'; end if;
  if v_after < 0 then raise exception 'Only % in stock — you cannot remove more than that.', v_before; end if;
  if p_mode <> 'set' and p_amount = 0 then raise exception 'Enter an amount greater than zero.'; end if;
  update inventory_items set quantity = v_after where id = p_item_id;
  insert into inventory_transactions (item_id, change, quantity_after, reason, note, created_by)
  values (p_item_id, v_after - v_before, v_after, v_reason, nullif(btrim(coalesce(p_note, '')), ''), auth.uid());
  return jsonb_build_object('quantity', v_after);
end $$;

-- ───────── menu admin helpers ─────────
create or replace function public.delete_category(p_id uuid, p_move_to uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_owner() then raise exception 'Only the owner can do this.' using errcode = '42501'; end if;
  select count(*) into n from products where category_id = p_id;
  if n > 0 then
    if p_move_to is null then raise exception 'This category has % product(s). Choose where to move them first.', n using hint = 'has_products'; end if;
    if p_move_to = p_id or not exists (select 1 from categories where id = p_move_to) then raise exception 'Choose a different category to move products into.'; end if;
    update products set category_id = p_move_to where category_id = p_id;
  end if;
  delete from categories where id = p_id;
  return jsonb_build_object('moved', n);
end $$;

create or replace function public.duplicate_product(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_new uuid;
begin
  if not is_owner() then raise exception 'Only the owner can do this.' using errcode = '42501'; end if;
  insert into products (category_id, name, description, price_paise, image_url, is_available, is_bestseller, is_new, is_customizable, sort_order)
  select category_id, left(name || ' (copy)', 80), description, price_paise, image_url, false, false, is_new, is_customizable, sort_order + 1
    from products where id = p_id returning id into v_new;
  if v_new is null then raise exception 'Product not found.'; end if;
  insert into product_option_groups (product_id, group_id) select v_new, group_id from product_option_groups where product_id = p_id;
  insert into product_ingredients (product_id, item_id, quantity) select v_new, item_id, quantity from product_ingredients where product_id = p_id;
  return v_new;
end $$;

-- ───────── team management ─────────
create or replace function public._create_user(p_email text, p_password text, p_name text, p_role text) returns uuid
language plpgsql security definer set search_path = public, extensions, auth as $$
declare v_id uuid := gen_random_uuid(); v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address.'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Password must be at least 8 characters.'; end if;
  if p_role not in ('owner', 'staff') then raise exception 'Unknown role.'; end if;
  if exists (select 1 from auth.users where email = v_email) then raise exception 'An account with this email already exists.'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', coalesce(p_name, '')), now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());
  insert into public.profiles (id, full_name, email, role)
  values (v_id, coalesce(nullif(btrim(p_name), ''), split_part(v_email, '@', 1)), v_email, p_role);
  return v_id;
end $$;

create or replace function public.create_staff_account(p_email text, p_password text, p_name text, p_role text default 'staff') returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'Only the owner can add team members.' using errcode = '42501'; end if;
  return _create_user(p_email, p_password, p_name, p_role);
end $$;

create or replace function public.set_staff_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'Only the owner can do this.' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot deactivate your own account.'; end if;
  update profiles set is_active = p_active where id = p_user;
end $$;

-- ───────── demo data ─────────
create or replace function public._generate_demo_orders(p_days int default 30) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  names text[] := array['Aarav Mehta','Diya Sharma','Kabir Singh','Ananya Iyer','Vihaan Rao','Ishita Kulkarni','Arjun Nair',
    'Meera Joshi','Rohan Desai','Sara Khan','Aditya Patil','Kavya Reddy','Neel Shah','Tara Menon','Yash Gupta','Riya Kapoor',
    'Dev Malhotra','Zoya Ali','Karan Bhat','Nisha Pillai','Om Jadhav','Pooja Verma'];
  s public.shop_settings; d int; n int; k int; j int; t timestamptz; v_status text; v_counter boolean; r record; v_id uuid; v_item uuid;
  v_sub int; v_disc int; v_tax int; v_pay text; v_coupon public.coupons; pr record; v_opts uuid[]; v_opt_total int; v_qty int;
  v_total_orders int := 0; today date := (now() at time zone 'Asia/Kolkata')::date; live record; v_live boolean;
begin
  select * into s from shop_settings where id = 1;
  select * into v_coupon from coupons where code = 'WAFFLE10';
  for d in reverse (p_days - 1)..0 loop
    n := 6 + floor(random() * 8)::int + case when extract(isodow from today - d) in (5, 6, 7) then 5 else 0 end;
    if d = 0 then n := 7; end if;
    for k in 1..n loop
      v_live := false;
      t := ((today - d)::timestamp + interval '11 hours' + random() * interval '11 hours') at time zone 'Asia/Kolkata';
      if d = 0 then t := now() - interval '70 minutes' - random() * interval '5 hours'; end if;
      v_counter := random() < 0.45;
      v_status := case when not v_counter and random() < 0.07 then 'cancelled' else 'completed' end;
      v_pay := case when random() < 0.55 then 'cash' else 'upi' end;
      insert into orders (order_number, customer_name, phone, order_type, payment_method, payment_status, status, tax_percent, is_demo, created_at,
                          accepted_at, preparing_at, ready_at, completed_at, cancelled_at, cancel_reason, inventory_deducted_at, source)
      values (_new_order_number(), case when v_counter and random() < 0.6 then 'Walk-in customer' else names[1 + floor(random() * array_length(names, 1))::int] end,
              case when v_counter then '' else '9' || lpad(floor(random() * 1e9)::bigint::text, 9, '0') end,
              case when random() < 0.7 then 'takeaway' else 'dine_in' end, v_pay,
              case when v_status = 'completed' then 'paid' else 'unpaid' end, v_status, s.tax_percent, true, t,
              t + interval '2 minutes', case when v_status = 'completed' then t + interval '4 minutes' end,
              case when v_status = 'completed' then t + interval '13 minutes' end,
              case when v_status = 'completed' then t + interval '19 minutes' end,
              case when v_status = 'cancelled' then t + interval '3 minutes' end,
              case when v_status = 'cancelled' then 'Customer did not arrive' end,
              case when v_status = 'completed' then t + interval '19 minutes' end, case when v_counter then 'counter' else 'online' end)
      returning id into v_id;
      v_sub := 0;
      j := 0;
      for pr in select p.id, p.name, p.price_paise, c.name cat from products p join categories c on c.id = p.category_id
                 where p.is_available order by random() * case when p.is_bestseller then 0.45 else 1 end
                 limit 1 + floor(random() * 2.4)::int loop
        j := j + 1;
        v_qty := case when random() < 0.2 then 2 else 1 end;
        select coalesce(array_agg(id), '{}') into v_opts from (
          select o.id from options o join product_option_groups g on g.group_id = o.group_id and g.product_id = pr.id
            join option_groups og on og.id = o.group_id
           where o.is_active and (og.required or random() < 0.18)
           order by og.required desc, random() limit 2) z;
        select coalesce(sum(price_paise), 0) into v_opt_total from options where id = any(v_opts);
        insert into order_items (order_id, product_id, product_name, category_name, base_price_paise, options_price_paise, unit_price_paise, quantity, line_total_paise, position)
        values (v_id, pr.id, pr.name, pr.cat, pr.price_paise, v_opt_total, pr.price_paise + v_opt_total, v_qty, (pr.price_paise + v_opt_total) * v_qty, j)
        returning id into v_item;
        insert into order_item_options (order_item_id, option_id, group_name, option_name, price_paise)
        select v_item, o.id, og.name, o.name, o.price_paise from options o join option_groups og on og.id = o.group_id where o.id = any(v_opts);
        v_sub := v_sub + (pr.price_paise + v_opt_total) * v_qty;
      end loop;
      v_disc := 0;
      if v_coupon.id is not null and v_sub >= v_coupon.min_order_paise and random() < 0.12 then
        v_disc := least(floor(v_sub * v_coupon.discount_value / 100.0)::int, coalesce(v_coupon.max_discount_paise, v_sub));
      end if;
      v_tax := round((v_sub - v_disc)::numeric * s.tax_percent / 100);
      update orders set subtotal_paise = v_sub, discount_paise = v_disc, tax_paise = v_tax, total_paise = v_sub - v_disc + v_tax,
             coupon_id = case when v_disc > 0 then v_coupon.id end, coupon_code = case when v_disc > 0 then v_coupon.code end
       where id = v_id;
      insert into order_status_history (order_id, from_status, to_status, note, created_at) values (v_id, null, 'new', 'Demo order', t);
      if v_status = 'completed' then
        insert into order_status_history (order_id, from_status, to_status, created_at) values
          (v_id, 'new', 'accepted', t + interval '2 minutes'), (v_id, 'accepted', 'preparing', t + interval '4 minutes'),
          (v_id, 'preparing', 'ready', t + interval '13 minutes'), (v_id, 'ready', 'completed', t + interval '19 minutes');
      else
        insert into order_status_history (order_id, from_status, to_status, note, created_at) values (v_id, 'new', 'cancelled', 'Customer did not arrive', t + interval '3 minutes');
      end if;
      v_total_orders := v_total_orders + 1;
    end loop;
  end loop;

  -- a few live orders so the board and kitchen have something to show
  for live in select * from (values
      ('new', 2, 'Riya Kapoor', 'Less sweet, please'), ('new', 5, 'Kabir Singh', ''),
      ('accepted', 9, 'Ananya Iyer', ''), ('preparing', 14, 'Neel Shah', 'Extra crispy waffle'),
      ('ready', 21, 'Meera Joshi', '')) as v(st, mins, nm, note) loop
    t := now() - make_interval(mins => live.mins);
    insert into orders (order_number, customer_name, phone, order_type, payment_method, payment_status, status, notes, tax_percent, is_demo, created_at,
                        accepted_at, preparing_at, ready_at)
    values (_new_order_number(), live.nm, '9' || lpad(floor(random() * 1e9)::bigint::text, 9, '0'),
            case when live.st = 'accepted' then 'dine_in' else 'takeaway' end, case when live.mins > 10 then 'upi' else 'cash' end,
            'unpaid', live.st, live.note, s.tax_percent, true, t,
            case when live.st in ('accepted', 'preparing', 'ready') then t + interval '1 minute' end,
            case when live.st in ('preparing', 'ready') then t + interval '3 minutes' end,
            case when live.st = 'ready' then t + interval '15 minutes' end)
    returning id into v_id;
    v_sub := 0; j := 0;
    for pr in select p.id, p.name, p.price_paise, c.name cat from products p join categories c on c.id = p.category_id
               where p.is_available and c.slug <> 'combos' order by random() limit 1 + floor(random() * 2)::int loop
      j := j + 1;
      select coalesce(array_agg(id), '{}') into v_opts from (
        select o.id from options o join product_option_groups g on g.group_id = o.group_id and g.product_id = pr.id
         where o.is_active order by random() limit 2) z;
      select coalesce(sum(price_paise), 0) into v_opt_total from options where id = any(v_opts);
      insert into order_items (order_id, product_id, product_name, category_name, base_price_paise, options_price_paise, unit_price_paise, quantity, line_total_paise, notes, position)
      values (v_id, pr.id, pr.name, pr.cat, pr.price_paise, v_opt_total, pr.price_paise + v_opt_total, 1, pr.price_paise + v_opt_total,
              case when j = 1 and live.st = 'preparing' then 'Cut into 4 pieces' else '' end, j)
      returning id into v_item;
      insert into order_item_options (order_item_id, option_id, group_name, option_name, price_paise)
      select v_item, o.id, og.name, o.name, o.price_paise from options o join option_groups og on og.id = o.group_id where o.id = any(v_opts);
      v_sub := v_sub + pr.price_paise + v_opt_total;
    end loop;
    v_tax := round(v_sub::numeric * s.tax_percent / 100);
    update orders set subtotal_paise = v_sub, tax_paise = v_tax, total_paise = v_sub + v_tax where id = v_id;
    insert into order_status_history (order_id, from_status, to_status, note, created_at) values (v_id, null, 'new', 'Demo order', t);
    if live.st in ('accepted', 'preparing', 'ready') then insert into order_status_history (order_id, from_status, to_status, created_at) values (v_id, 'new', 'accepted', t + interval '1 minute'); end if;
    if live.st in ('preparing', 'ready') then insert into order_status_history (order_id, from_status, to_status, created_at) values (v_id, 'accepted', 'preparing', t + interval '3 minutes'); end if;
    if live.st = 'ready' then insert into order_status_history (order_id, from_status, to_status, created_at) values (v_id, 'preparing', 'ready', t + interval '15 minutes'); end if;
    v_total_orders := v_total_orders + 1;
  end loop;
  for r in select id from orders where is_demo and status = 'completed' and receipt_no is null order by completed_at loop
    update orders set receipt_no = _bill_no() where id = r.id;
  end loop;
  update coupons c set used_count = (select count(*) from orders o where o.coupon_id = c.id and o.status <> 'cancelled');
  return v_total_orders;
end $$;

create or replace function public.reset_demo_data(p_regenerate boolean default true) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; v_removed int; v_created int := 0;
begin
  if not is_owner() then raise exception 'Only the owner can reset demo data.' using errcode = '42501'; end if;
  -- give back stock that demo orders used (real items only; demo items are restored to their seeded level below)
  for r in select t.item_id, sum(t.change) ch from inventory_transactions t join orders o on o.id = t.order_id
            join inventory_items i on i.id = t.item_id
            where o.is_demo and t.reason = 'order' and not i.is_demo group by t.item_id loop
    update inventory_items set quantity = quantity - r.ch where id = r.item_id;
    insert into inventory_transactions (item_id, change, quantity_after, reason, note, created_by)
    select r.item_id, -r.ch, quantity, 'demo_restore', 'Stock returned from removed demo orders', auth.uid() from inventory_items where id = r.item_id;
  end loop;
  delete from orders where is_demo;
  get diagnostics v_removed = row_count;
  update inventory_items set quantity = demo_default_quantity where is_demo and demo_default_quantity is not null;
  delete from inventory_transactions t using inventory_items i where i.id = t.item_id and i.is_demo;
  update coupons c set used_count = (select count(*) from orders o where o.coupon_id = c.id and o.status <> 'cancelled');
  if p_regenerate then v_created := _generate_demo_orders(30); end if;
  return jsonb_build_object('removed', v_removed, 'created', v_created);
end $$;

-- ───────── function privileges ─────────
revoke execute on function public._uuid(text), public._inr(int), public._new_order_number(), public._coupon_eval(public.coupons, int),
  public._order_json(uuid, boolean), public._deduct_inventory(uuid), public._create_user(text, text, text, text),
  public._generate_demo_orders(int), public._bill_no() from public, anon, authenticated;
revoke execute on function public.update_order_status(uuid, text, text, text), public.set_payment_status(uuid, text),
  public.record_receipt_print(uuid, text, text, text), public.assign_receipt_no(uuid), public.adjust_inventory(uuid, text, numeric, text, text),
  public.delete_category(uuid, uuid), public.duplicate_product(uuid), public.create_staff_account(text, text, text, text),
  public.set_staff_active(uuid, boolean), public.reset_demo_data(boolean) from public, anon;
grant execute on function public.update_order_status(uuid, text, text, text), public.set_payment_status(uuid, text),
  public.record_receipt_print(uuid, text, text, text), public.assign_receipt_no(uuid), public.adjust_inventory(uuid, text, numeric, text, text),
  public.delete_category(uuid, uuid), public.duplicate_product(uuid), public.create_staff_account(text, text, text, text),
  public.set_staff_active(uuid, boolean), public.reset_demo_data(boolean) to authenticated;
grant execute on function public.place_order(jsonb), public.track_order(text, text), public.validate_coupon(text, int),
  public.get_site_offers(), public.is_staff(), public.is_owner() to anon, authenticated;
