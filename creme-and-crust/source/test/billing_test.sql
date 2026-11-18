\set ON_ERROR_STOP 1
select public._create_user('owner2@test.local', 'OwnerPass#2026', 'Owner Two', 'owner') as owner_id \gset
select public._create_user('staff2@test.local', 'StaffPass#2026', 'Staff Two', 'staff') as staff_id \gset
select set_config('t.owner', :'owner_id', false), set_config('t.staff', :'staff_id', false);
update shop_settings set demo_mode = false;

begin; set local role anon;
do $$ begin perform create_counter_bill('{"items":[]}'); raise exception 'anon could bill'; exception when insufficient_privilege then raise notice 'ok: anon cannot create bills'; end $$;
commit;

begin; set local role authenticated; select set_config('request.jwt.claim.sub', current_setting('t.staff'), true);
do $$
declare r jsonb; r2 jsonb; r3 jsonb; ref uuid := gen_random_uuid(); choco uuid; caramel uuid; n1 int; n2 int; cnt int; batter_before numeric; batter_after numeric;
begin
  select id into choco from products where name = 'Choco Overload';
  select o.id into caramel from options o join option_groups g on g.id = o.group_id where g.name = 'Sauces' and o.name = 'Caramel';
  select quantity into batter_before from inventory_items where name = 'Waffle batter';
  -- 2x Choco Overload + caramel (2 x 169 = 338) + custom 1x ₹45.50  → 383.50 ; 10% off → 38.35 floor → 3835 paise ; tax 5% of 34515 = 1725.75 → 1726
  r := create_counter_bill(jsonb_build_object('client_ref', ref, 'payment_method', 'cash', 'discount_type', 'percent', 'discount_value', 10, 'apply_tax', true,
        'items', jsonb_build_array(jsonb_build_object('product_id', choco, 'quantity', 2, 'option_ids', jsonb_build_array(caramel)),
                                   jsonb_build_object('name', 'Extra cup', 'unit_price_paise', 4550, 'quantity', 1))));
  assert (r->>'subtotal_paise')::int = 38350, 'sub ' || (r->>'subtotal_paise');
  assert (r->>'discount_paise')::int = 3835, 'disc ' || (r->>'discount_paise');
  assert (r->>'tax_paise')::int = 1726, 'tax ' || (r->>'tax_paise');
  assert (r->>'total_paise')::int = 38350 - 3835 + 1726, 'total';
  assert r->>'status' = 'completed' and r->>'payment_status' = 'paid' and r->>'source' = 'counter', 'state';
  assert r->>'receipt_no' ~ '^B[0-9]+$', 'bill no ' || coalesce(r->>'receipt_no', 'null');
  assert r->>'customer_name' = 'Walk-in customer', 'walk-in';
  assert r->>'discount_label' = '10%', 'label ' || coalesce(r->>'discount_label', 'null');
  select quantity into batter_after from inventory_items where name = 'Waffle batter';
  assert batter_before - batter_after = 0.24, 'stock deducted for direct bill';
  raise notice 'ok: counter bill % total % (sub %, disc %, tax %)', r->>'receipt_no', r->>'total_paise', r->>'subtotal_paise', r->>'discount_paise', r->>'tax_paise';
  r2 := create_counter_bill(jsonb_build_object('client_ref', ref, 'payment_method', 'cash', 'items', jsonb_build_array(jsonb_build_object('name', 'x', 'unit_price_paise', 1, 'quantity', 1))));
  assert r2->>'receipt_no' = r->>'receipt_no' and (r2->>'duplicate')::boolean, 'idempotent';
  raise notice 'ok: double-tap returns the same bill, no duplicate';
  -- flat discount, no tax, sent to kitchen
  r3 := create_counter_bill(jsonb_build_object('payment_method', 'upi', 'discount_type', 'fixed', 'discount_value', 2000, 'apply_tax', false, 'send_to_kitchen', true, 'customer_name', 'Anil',
        'items', jsonb_build_array(jsonb_build_object('product_id', (select id from products where name='Classic Belgian'), 'quantity', 3))));
  assert (r3->>'total_paise')::int = 29700 - 2000 and (r3->>'tax_paise')::int = 0, 'flat/no tax';
  assert r3->>'status' = 'accepted', 'kitchen status';
  n1 := substr(r->>'receipt_no', 2)::int; n2 := substr(r3->>'receipt_no', 2)::int;
  assert n2 > n1, 'sequential numbering';
  raise notice 'ok: flat discount without tax, sent to kitchen as accepted, bill numbers increase (% → %)', r->>'receipt_no', r3->>'receipt_no';
  begin perform create_counter_bill(jsonb_build_object('payment_method', 'cash', 'discount_type', 'fixed', 'discount_value', 999999, 'items', jsonb_build_array(jsonb_build_object('name', 'x', 'unit_price_paise', 100, 'quantity', 1)))); raise exception 'overdiscount allowed';
  exception when others then assert sqlerrm like '%more than the subtotal%', sqlerrm; end;
  begin perform create_counter_bill(jsonb_build_object('payment_method', 'cash', 'items', jsonb_build_array(jsonb_build_object('name', 'x', 'unit_price_paise', -5, 'quantity', 1)))); raise exception 'negative price allowed';
  exception when others then assert sqlerrm like '%valid price%', sqlerrm; end;
  begin perform create_counter_bill(jsonb_build_object('payment_method', 'bitcoin', 'items', jsonb_build_array(jsonb_build_object('name', 'x', 'unit_price_paise', 5, 'quantity', 1)))); raise exception 'bad method allowed';
  exception when others then assert sqlerrm like '%payment method%', sqlerrm; end;
  begin perform create_counter_bill(jsonb_build_object('payment_method', 'cash', 'discount_type', 'percent', 'discount_value', 120, 'items', jsonb_build_array(jsonb_build_object('name', 'x', 'unit_price_paise', 5, 'quantity', 1)))); raise exception '120 percent allowed';
  exception when others then assert sqlerrm like '%between 0 and 100%', sqlerrm; end;
  raise notice 'ok: invalid discounts, prices and payment methods rejected';
  select count(*) into cnt from (select receipt_no from orders where receipt_no is not null group by receipt_no having count(*) > 1) d;
  assert cnt = 0, 'duplicate bill numbers exist';
  raise notice 'ok: no duplicate bill numbers across % bills', (select count(*) from orders where receipt_no is not null);
end $$;
-- daily sales: today's row must equal the sum of qualifying orders
do $$ declare d record; exp record; begin
  select * into d from sales_by_day((now() at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date);
  select count(*) bills, coalesce(sum(total_paise),0) rev, coalesce(sum(total_paise) filter (where payment_method='cash'),0) cash,
         coalesce(sum(total_paise) filter (where payment_method='upi'),0) upi into exp
    from orders where (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date and status <> 'cancelled' and (payment_status = 'paid' or status = 'completed');
  assert d.bills = exp.bills and d.revenue = exp.rev and d.cash = exp.cash and d.upi = exp.upi, format('sales mismatch %s vs %s', row_to_json(d), row_to_json(exp));
  raise notice 'ok: today % bills, revenue %, cash %, upi % (matches raw orders)', d.bills, d.revenue, d.cash, d.upi;
end $$;
do $$ begin perform delete_order_permanently((select id from orders where source='counter' limit 1), 'x', 'test'); raise exception 'staff deleted';
exception when insufficient_privilege then raise notice 'ok: staff cannot delete bills'; end $$;
commit;

-- online order gets a bill number once paid; owner deletes with audit
begin; set local role authenticated; select set_config('request.jwt.claim.sub', current_setting('t.owner'), true);
do $$ declare oid uuid; no text; n int; begin
  select id into oid from orders where status = 'new' and receipt_no is null limit 1;
  perform set_payment_status(oid, 'paid');
  select receipt_no into no from orders where id = oid;
  assert no ~ '^B[0-9]+$', 'paid online order got bill no';
  begin perform delete_order_permanently(oid, 'WRONG', 'duplicate'); raise exception 'wrong confirm accepted';
  exception when others then assert sqlerrm like '%exactly%', sqlerrm; end;
  perform delete_order_permanently(oid, no, 'Duplicate test bill');
  assert not exists (select 1 from orders where id = oid), 'not deleted';
  select count(*) into n from deleted_bills_log where receipt_no = no; assert n = 1, 'audit missing';
  raise notice 'ok: online order paid → bill %, owner deleted it with audit log', no;
end $$;
commit;
\echo ALL BILLING TESTS PASSED
