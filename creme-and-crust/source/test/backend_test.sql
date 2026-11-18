\set ON_ERROR_STOP 1
update shop_settings set demo_mode = false;
-- owner + staff accounts for tests
select public._create_user('owner@test.local', 'OwnerPass#2026', 'Test Owner', 'owner') as owner_id \gset
select public._create_user('staff@test.local', 'StaffPass#2026', 'Test Staff', 'staff') as staff_id \gset
select set_config('t.owner', :'owner_id', false), set_config('t.staff', :'staff_id', false);

create or replace function pg_temp.expect_error(q text, needle text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then
    if position(lower(needle) in lower(sqlerrm)) = 0 then raise exception 'Wrong error for %: got "%" expected "%"', q, sqlerrm, needle; end if;
    raise notice 'ok (rejected): %', left(sqlerrm, 90); return;
  end;
  raise exception 'Expected error "%" but query succeeded: %', needle, q;
end $$;

-- ───── 1. anonymous customer places an order ─────
begin;
set local role anon;
do $$
declare r jsonb; r2 jsonb; p uuid; o_choc uuid; o_almond uuid; ref uuid := gen_random_uuid(); exp_sub int; exp_disc int; exp_tax int;
begin
  select id into p from products where name = 'Choco Overload';
  select o.id into o_choc from options o join option_groups g on g.id = o.group_id where g.name = 'Sauces' and o.name = 'Caramel';
  select o.id into o_almond from options o join option_groups g on g.id = o.group_id where g.name = 'Toppings' and o.name = 'Almonds';
  r := place_order(jsonb_build_object('client_ref', ref, 'customer_name', 'Asha Test', 'phone', '+91 98111 22333',
        'order_type', 'takeaway', 'payment_method', 'upi', 'coupon_code', 'waffle10',
        'items', jsonb_build_array(
          jsonb_build_object('product_id', p, 'quantity', 2, 'option_ids', jsonb_build_array(o_choc, o_almond), 'unit_price_paise', 1, 'notes', 'no nuts on one'),
          jsonb_build_object('product_id', (select id from products where name='Classic Belgian'), 'quantity', 1))));
  exp_sub := (14900 + 2000 + 3000) * 2 + 9900;           -- 49700
  exp_disc := least(floor(exp_sub * 0.10)::int, 5000);    -- 4970
  exp_tax := round((exp_sub - exp_disc) * 0.05);          -- 2237
  assert (r->>'subtotal_paise')::int = exp_sub, 'subtotal ' || (r->>'subtotal_paise');
  assert (r->>'discount_paise')::int = exp_disc, 'discount ' || (r->>'discount_paise');
  assert (r->>'tax_paise')::int = exp_tax, 'tax ' || (r->>'tax_paise');
  assert (r->>'total_paise')::int = exp_sub - exp_disc + exp_tax, 'total';
  assert r->>'phone' like '••••••2333', 'phone masked';
  assert r->>'id' is null, 'no internal id exposed';
  assert jsonb_array_length(r->'items'->0->'options') = 2, 'options stored';
  raise notice 'ok: order % total % (sub %, disc %, tax %)', r->>'order_number', r->>'total_paise', exp_sub, exp_disc, exp_tax;
  -- idempotent retry
  r2 := place_order(jsonb_build_object('client_ref', ref, 'customer_name', 'Asha Test', 'phone', '9811122333', 'order_type', 'takeaway',
        'payment_method', 'upi', 'items', jsonb_build_array(jsonb_build_object('product_id', p, 'quantity', 1))));
  assert r2->>'order_number' = r->>'order_number' and (r2->>'duplicate')::boolean, 'idempotent';
  raise notice 'ok: duplicate submit returned the same order';
  -- tracking
  assert track_order(r->>'order_number', '9811122333') is not null, 'track ok';
  assert track_order(r->>'order_number', '9811122334') is null, 'wrong phone hidden';
  assert track_order(lower(r->>'order_number'), '+91-98111-22333') is not null, 'track normalises input';
  raise notice 'ok: tracking needs the right phone';
  perform set_config('t.order', r->>'order_number', false);
end $$;
-- anon can't read or write orders directly
select pg_temp.expect_error($q$select count(*) from orders$q$, 'permission denied');
select pg_temp.expect_error($q$insert into orders(order_number, customer_name, phone, order_type, payment_method) values ('X','a','9999999999','takeaway','cash')$q$, 'permission denied');
commit;

begin; set local role anon;
select pg_temp.expect_error($q$update products set price_paise = 1$q$, 'permission denied');
commit;
begin; set local role anon;
select pg_temp.expect_error($q$select * from coupons$q$, 'permission denied');
select pg_temp.expect_error($q$select update_order_status(gen_random_uuid(), 'new', 'accepted')$q$, 'permission denied');
select pg_temp.expect_error($q$select _generate_demo_orders(1)$q$, 'permission denied');
commit;

-- ───── 2. validation & coupon rules ─────
begin; set local role anon;
create temp table t_ids as select
  (select id from products where name = 'Classic Belgian') classic,
  (select id from products where name = 'Waffle + Drink Combo') combo,
  (select o.id from options o join option_groups g on g.id=o.group_id where g.name='Choose your drink' and o.name='Iced Latte') latte,
  (select o.id from options o join option_groups g on g.id=o.group_id where g.name='Choose your drink' and o.name='Cold Coffee') coffee;
commit;
begin; set local role anon;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"A","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1}]}')$q$, classic), 'enter your name') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"12345","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1}]}')$q$, classic), 'mobile number') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"card","items":[{"product_id":"%s","quantity":1}]}')$q$, classic), 'payment method') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"delivery","payment_method":"cash","items":[{"product_id":"%s","quantity":1}]}')$q$, classic), 'takeaway or dine-in') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":0}]}')$q$, classic), 'between 1 and 20') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1,"option_ids":["%s"]}]}')$q$, classic, latte), 'no longer available') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1}]}')$q$, combo), 'choose "choose your drink"') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1,"option_ids":["%s","%s"]}]}')$q$, combo, latte, coffee), 'too many choices') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","coupon_code":"WAFFLE10","items":[{"product_id":"%s","quantity":1}]}')$q$, classic), 'more to use waffle10') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","coupon_code":"MONSOON20","items":[{"product_id":"%s","quantity":5}]}')$q$, classic), 'expired') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","coupon_code":"STAFF15","items":[{"product_id":"%s","quantity":5}]}')$q$, classic), 'not active') from t_ids;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","coupon_code":"NOPE","items":[{"product_id":"%s","quantity":5}]}')$q$, classic), 'not valid') from t_ids;
select (validate_coupon('double40', 40000)->>'discount_paise')::int = 4000 as double40_ok, (validate_coupon('WAFFLE10', 90000)->>'discount_paise')::int = 5000 as waffle10_capped;
select jsonb_array_length(get_site_offers()) = 2 as two_site_offers;
-- combo with a valid single drink works and charges the shake upcharge
select (place_order(format('{"customer_name":"Combo Test","phone":"9822233444","order_type":"dine_in","table_label":"T4","payment_method":"cash","items":[{"product_id":"%s","quantity":1,"option_ids":["%s"]}]}', combo, latte)::jsonb)->>'subtotal_paise')::int = 21900 as combo_ok from t_ids;
commit;

-- unavailable product is rejected
update products set is_available = false where name = 'Iced Latte';
begin; set local role anon;
select pg_temp.expect_error(format($q$select place_order('{"customer_name":"Ab","phone":"9811122333","order_type":"takeaway","payment_method":"cash","items":[{"product_id":"%s","quantity":1}]}')$q$, (select id from products where name='Iced Latte')), 'no longer available');
commit;
update products set is_available = true where name = 'Iced Latte';

-- ───── 3. staff workflow ─────
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('t.staff'), true);
do $$
declare oid uuid; inv_before numeric; inv_after numeric; r jsonb; n int;
begin
  assert is_staff() and not is_owner(), 'staff role';
  select id into oid from orders where order_number = current_setting('t.order');
  assert oid is not null, 'staff can read the order';
  select quantity into inv_before from inventory_items where name = 'Waffle batter';
  perform update_order_status(oid, 'new', 'accepted');
  begin perform update_order_status(oid, 'new', 'accepted'); raise exception 'stale not detected';
  exception when others then assert sqlerrm like '%already moved%', sqlerrm; end;
  begin perform update_order_status(oid, 'accepted', 'completed'); raise exception 'skip not detected';
  exception when others then assert sqlerrm like '%cannot be moved%', sqlerrm; end;
  perform update_order_status(oid, 'accepted', 'preparing');
  perform update_order_status(oid, 'preparing', 'ready');
  perform set_payment_status(oid, 'paid');
  perform update_order_status(oid, 'ready', 'completed');
  select quantity into inv_after from inventory_items where name = 'Waffle batter';
  assert inv_before - inv_after = 0.36, 'batter deducted 3 x 0.12, got ' || (inv_before - inv_after);
  begin perform update_order_status(oid, 'completed', 'completed'); raise exception 'double complete not blocked';
  exception when others then assert sqlerrm like '%cannot be moved%', sqlerrm; end;
  select count(*) into n from order_status_history where order_id = oid;
  assert n = 6, 'history rows ' || n;
  r := record_receipt_print(oid, 'browser', 'sent_to_browser', '80');
  assert r->>'kind' = 'original', 'first print original';
  r := record_receipt_print(oid, 'simulated', 'simulated', '58');
  assert r->>'kind' = 'reprint' and (r->>'print_count')::int = 2, 'reprint';
  r := adjust_inventory((select id from inventory_items where name='Cups'), 'add', 50, null, 'Delivery');
  begin perform adjust_inventory((select id from inventory_items where name='Cups'), 'remove', 99999); raise exception 'negative stock allowed';
  exception when others then assert sqlerrm like '%cannot remove more%', sqlerrm; end;
  raise notice 'ok: staff workflow, once-only stock deduction, receipts, inventory';
end $$;
commit;

-- internal deduction called again (as the DB owner) must be a no-op
do $$ declare q1 numeric; q2 numeric; oid uuid; begin
  select id into oid from orders where order_number = current_setting('t.order');
  select quantity into q1 from inventory_items where name = 'Waffle batter';
  perform _deduct_inventory(oid);
  select quantity into q2 from inventory_items where name = 'Waffle batter';
  assert q1 = q2, 'deducted twice!'; raise notice 'ok: stock never deducted twice';
end $$;
-- staff cannot edit menu (RLS returns 0 rows), cannot reset demo
begin; set local role authenticated; select set_config('request.jwt.claim.sub', current_setting('t.staff'), true);
with u as (update products set price_paise = 1 where name = 'Classic Belgian' returning 1) select count(*) = 0 as staff_cannot_edit_menu from u;
select pg_temp.expect_error($q$select reset_demo_data(false)$q$, 'only the owner');
commit;

-- outsider with a valid login but no profile sees nothing
begin; set local role authenticated; select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
select count(*) = 0 as outsider_sees_no_orders from orders;
select pg_temp.expect_error($q$select update_order_status((select gen_random_uuid()), 'new', 'accepted')$q$, 'not allowed');
commit;

-- cancelling an accepted order needs a reason and returns coupon usage
begin; set local role authenticated; select set_config('request.jwt.claim.sub', current_setting('t.owner'), true);
do $$ declare oid uuid; used_before int; used_after int; begin
  select id into oid from orders where customer_name = 'Combo Test';
  perform update_order_status(oid, 'new', 'accepted');
  begin perform update_order_status(oid, 'accepted', 'cancelled'); raise exception 'no reason accepted';
  exception when others then assert sqlerrm like '%give a reason%', sqlerrm; end;
  perform update_order_status(oid, 'accepted', 'cancelled', 'Out of ice cream');
  assert (select status from orders where id = oid) = 'cancelled';
  raise notice 'ok: cancel with reason';
end $$;
-- owner: category delete protection, duplicate product, demo reset
do $$ declare cat uuid; tgt uuid; r jsonb; nd int; nr int; begin
  assert is_owner();
  select id into cat from categories where slug = 'fruit'; select id into tgt from categories where slug = 'classic';
  begin perform delete_category(cat); raise exception 'deleted category with products';
  exception when others then assert sqlerrm like '%Choose where to move%', sqlerrm; end;
  perform delete_category(cat, tgt);
  assert (select count(*) from products where name in ('Strawberry Dream','Banana Caramel') and category_id = tgt) = 2;
  perform duplicate_product((select id from products where name = 'Oreo Crunch'));
  assert exists(select 1 from products where name = 'Oreo Crunch (copy)' and not is_available);
  select count(*) into nr from orders where not is_demo;
  r := reset_demo_data(true);
  select count(*) into nd from orders where is_demo;
  assert (select count(*) from orders where not is_demo) = nr, 'real orders untouched';
  assert (select quantity from inventory_items where name = 'Waffle batter') = 12, 'demo stock restored';
  raise notice 'ok: owner tools; demo reset removed % / created % (real orders kept: %)', r->>'removed', r->>'created', nr;
end $$;
commit;
\echo ALL BACKEND TESTS PASSED
