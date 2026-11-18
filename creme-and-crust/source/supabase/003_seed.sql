-- Crème & Crust — demonstration data (all rows flagged is_demo where it matters)

insert into public.shop_settings (id, shop_name, tagline, description, phone, whatsapp, email, address, maps_url, instagram_url,
  hours, prep_minutes, payment_methods, upi_id, upi_name, tax_percent, tax_label, receipt_header, receipt_footer, demo_mode)
values (1, 'Crème & Crust', 'Made for your cravings.',
  'A small waffle bar making golden Belgian waffles to order — crisp outside, soft inside, finished with real chocolate, fresh fruit and a little bit of happiness.',
  '+91 90000 00000', '919000000000', 'hello@cremeandcrust.in', '12 Market Street, Pune 411001',
  'https://maps.google.com/?q=Pune', 'https://instagram.com/',
  '[{"day":"Mon","open":"12:00","close":"23:00","closed":false},{"day":"Tue","open":"12:00","close":"23:00","closed":false},
    {"day":"Wed","open":"12:00","close":"23:00","closed":false},{"day":"Thu","open":"12:00","close":"23:00","closed":false},
    {"day":"Fri","open":"11:00","close":"23:30","closed":false},{"day":"Sat","open":"11:00","close":"23:30","closed":false},
    {"day":"Sun","open":"11:00","close":"23:00","closed":false}]'::jsonb,
  12,
  '[{"key":"cash","label":"Cash","hint":"Pay at the counter when you collect","enabled":true},
    {"key":"upi","label":"UPI","hint":"Scan & pay at the counter, or pay to our UPI ID","enabled":true},
    {"key":"card","label":"Card","hint":"Pay by card at the counter","enabled":false}]'::jsonb,
  'cremeandcrust@upi', 'Creme and Crust', 5, 'GST', 'Fresh waffles · Made to order', 'Thank you for choosing Crème & Crust!', true)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, sort_order, is_demo) values
  ('Signature Waffles', 'signature', 'Our most-loved creations', 1, true),
  ('Classic Waffles', 'classic', 'Simple, golden, perfect', 2, true),
  ('Chocolate Waffles', 'chocolate', 'For serious chocolate people', 3, true),
  ('Fruit Waffles', 'fruit', 'Fresh fruit, light and bright', 4, true),
  ('Premium Waffles', 'premium', 'Indulgent, loaded, unforgettable', 5, true),
  ('Combos', 'combos', 'Waffle + drink, better together', 6, true),
  ('Beverages', 'beverages', 'Cold coffees and thick shakes', 7, true);


insert into public.products (category_id, name, description, price_paise, image_url, is_bestseller, is_new, is_customizable, sort_order, is_demo)
select c.id, v.name, v.descr, v.price, 'https://images.pexels.com/photos/' || v.pid || '/pexels-photo-' || v.pid || '.jpeg?auto=compress&cs=tinysrgb&w=900',
       v.best, v.new, v.custom, v.sort, true
from (values
  ('classic',   'Classic Belgian',      'Golden, crisp-edged Belgian waffle with butter and a light dusting of sugar.', 9900,  '374830',   false, false, true, 1),
  ('chocolate', 'Choco Overload',       'Dark chocolate sauce, chocolate chips and a scoop of vanilla ice cream.',      14900, '5659302',  true,  false, true, 2),
  ('signature', 'Oreo Crunch',          'Cookies-and-cream drizzle loaded with crushed Oreo and white chocolate.',      15900, '5848187',  true,  false, true, 3),
  ('premium',   'Lotus Biscoff',        'Warm Lotus spread, Biscoff crumble and a caramel drizzle.',                    18900, '8986282',  true,  false, true, 4),
  ('fruit',     'Strawberry Dream',     'Fresh strawberries, whipped cream and strawberry sauce.',                      16900, '11513598', false, true,  true, 5),
  ('premium',   'Brownie Blast',        'Fudgy brownie chunks, chocolate sauce and a vanilla scoop.',                   17900, '17229218', false, false, true, 6),
  ('chocolate', 'Double Chocolate',     'Chocolate waffle, double chocolate sauce and chocolate shavings.',             16900, '23913677', false, false, true, 7),
  ('signature', 'Nutella Bliss',        'A generous layer of Nutella, hazelnut crunch and fresh berries.',              17900, '32681505', true,  false, true, 8),
  ('fruit',     'Banana Caramel',       'Caramelised banana, salted caramel and roasted almonds.',                      14900, '4109460',  false, false, true, 9),
  ('combos',    'Waffle + Drink Combo', 'Any classic waffle with your choice of cold coffee, iced latte or shake.',     21900, '17558646', false, false, true, 10),
  ('beverages', 'Classic Cold Coffee',  'Slow-brewed coffee shaken with milk and ice.',                                  11900, '10540639', false, false, true, 11),
  ('beverages', 'Thick Chocolate Shake','Rich chocolate shake, thick enough for a spoon.',                              13900, '5946722',  false, true,  true, 12),
  ('beverages', 'Iced Latte',           'Double espresso over cold milk and ice.',                                       12900, '16496287', false, false, false, 13)
) as v(cat, name, descr, price, pid, best, new, custom, sort)
join public.categories c on c.slug = v.cat;

insert into public.option_groups (name, selection, max_select, required, sort_order, is_demo) values
  ('Choose your drink', 'single', 1, true, 0, true),
  ('Sauces', 'multi', 2, false, 1, true),
  ('Toppings', 'multi', 3, false, 2, true),
  ('Extras', 'multi', 0, false, 3, true);

insert into public.options (group_id, name, price_paise, sort_order, is_demo)
select g.id, v.name, v.price, v.sort, true from (values
  ('Choose your drink', 'Cold Coffee', 0, 1), ('Choose your drink', 'Iced Latte', 0, 2), ('Choose your drink', 'Chocolate Shake', 2000, 3),
  ('Sauces', 'Chocolate', 2000, 1), ('Sauces', 'White chocolate', 2500, 2), ('Sauces', 'Caramel', 2000, 3), ('Sauces', 'Strawberry', 2000, 4),
  ('Toppings', 'Oreo crumbs', 2500, 1), ('Toppings', 'Chocolate chips', 2000, 2), ('Toppings', 'Almonds', 3000, 3),
  ('Toppings', 'Sprinkles', 1500, 4), ('Toppings', 'Strawberries', 3500, 5),
  ('Extras', 'Extra chocolate', 3000, 1), ('Extras', 'Extra topping', 2500, 2), ('Extras', 'Ice cream scoop', 4000, 3)
) as v(grp, name, price, sort) join public.option_groups g on g.name = v.grp;

-- every waffle gets sauces / toppings / extras; combo adds the drink choice; shakes & cold coffee get extras
insert into public.product_option_groups (product_id, group_id)
select p.id, g.id from public.products p join public.categories c on c.id = p.category_id
join public.option_groups g on (
     (c.slug not in ('beverages', 'combos') and g.name in ('Sauces', 'Toppings', 'Extras'))
  or (c.slug = 'combos' and g.name in ('Choose your drink', 'Sauces', 'Toppings'))
  or (c.slug = 'beverages' and p.is_customizable and g.name = 'Extras'));

insert into public.coupons (code, title, description, discount_type, discount_value, max_discount_paise, min_order_paise, starts_at, expires_at, usage_limit, is_active, show_on_site, is_demo) values
  ('DOUBLE40', 'Double the happiness.', 'Get your waffle + drink combo — and save ₹40 on orders above ₹399.', 'fixed', 4000, null, 39900, now() - interval '1 day', now() + interval '120 days', 300, true, true, true),
  ('WAFFLE10', '10% off your next craving', 'Take 10% off orders above ₹199, up to ₹50.', 'percent', 10, 5000, 19900, null, now() + interval '180 days', 1000, true, true, true),
  ('STAFF15', 'Team treat', 'Staff discount — not shown on the website.', 'percent', 15, 7500, 0, null, null, null, false, false, true),
  ('MONSOON20', 'Monsoon special', 'Last season''s offer.', 'percent', 20, 6000, 29900, now() - interval '120 days', now() - interval '30 days', 200, true, false, true);

insert into public.inventory_items (name, unit, quantity, low_threshold, unit_cost_paise, is_demo, demo_default_quantity) values
  ('Waffle batter', 'kg', 12, 4, 9000, true, 12),
  ('Chocolate sauce', 'kg', 3.5, 1, 42000, true, 3.5),
  ('White chocolate', 'kg', 0.8, 1, 68000, true, 0.8),
  ('Strawberries', 'kg', 2, 1, 24000, true, 2),
  ('Oreo', 'packs', 18, 6, 3000, true, 18),
  ('Lotus spread', 'jars', 2, 3, 45000, true, 2),
  ('Almonds', 'kg', 1.5, 0.5, 90000, true, 1.5),
  ('Ice cream', 'litres', 6, 3, 22000, true, 6),
  ('Cups', 'pcs', 180, 60, 400, true, 180),
  ('Takeaway packaging', 'pcs', 240, 80, 600, true, 240);

-- simple recipes (per 1 unit sold)
insert into public.product_ingredients (product_id, item_id, quantity)
select p.id, i.id, v.qty from (values
  ('Classic Belgian', 'Waffle batter', 0.12), ('Classic Belgian', 'Takeaway packaging', 1),
  ('Choco Overload', 'Waffle batter', 0.12), ('Choco Overload', 'Chocolate sauce', 0.05), ('Choco Overload', 'Ice cream', 0.08), ('Choco Overload', 'Takeaway packaging', 1),
  ('Oreo Crunch', 'Waffle batter', 0.12), ('Oreo Crunch', 'Oreo', 0.25), ('Oreo Crunch', 'White chocolate', 0.03), ('Oreo Crunch', 'Takeaway packaging', 1),
  ('Lotus Biscoff', 'Waffle batter', 0.12), ('Lotus Biscoff', 'Lotus spread', 0.08), ('Lotus Biscoff', 'Takeaway packaging', 1),
  ('Strawberry Dream', 'Waffle batter', 0.12), ('Strawberry Dream', 'Strawberries', 0.08), ('Strawberry Dream', 'Takeaway packaging', 1),
  ('Brownie Blast', 'Waffle batter', 0.12), ('Brownie Blast', 'Chocolate sauce', 0.04), ('Brownie Blast', 'Ice cream', 0.08), ('Brownie Blast', 'Takeaway packaging', 1),
  ('Double Chocolate', 'Waffle batter', 0.12), ('Double Chocolate', 'Chocolate sauce', 0.07), ('Double Chocolate', 'Takeaway packaging', 1),
  ('Nutella Bliss', 'Waffle batter', 0.12), ('Nutella Bliss', 'Strawberries', 0.03), ('Nutella Bliss', 'Takeaway packaging', 1),
  ('Banana Caramel', 'Waffle batter', 0.12), ('Banana Caramel', 'Almonds', 0.02), ('Banana Caramel', 'Takeaway packaging', 1),
  ('Waffle + Drink Combo', 'Waffle batter', 0.12), ('Waffle + Drink Combo', 'Cups', 1), ('Waffle + Drink Combo', 'Takeaway packaging', 1),
  ('Classic Cold Coffee', 'Cups', 1), ('Thick Chocolate Shake', 'Cups', 1), ('Thick Chocolate Shake', 'Ice cream', 0.1),
  ('Thick Chocolate Shake', 'Chocolate sauce', 0.03), ('Iced Latte', 'Cups', 1)
) as v(prod, item, qty)
join public.products p on p.name = v.prod join public.inventory_items i on i.name = v.item;

select public._generate_demo_orders(30);
