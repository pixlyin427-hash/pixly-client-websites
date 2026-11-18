-- Crème & Crust — schema, security and business logic
-- Money is stored as integer paise. Prices are snapshotted on every order line.

create extension if not exists pgcrypto with schema extensions;

-- ───────────────────────── helpers ─────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── staff profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'staff' check (role in ('owner','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and is_active and role in ('owner','staff'))
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and is_active and role = 'owner')
$$;

-- ───────────────────────── shop settings (single row) ─────────────────────────
create table public.shop_settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'Crème & Crust',
  tagline text not null default 'Made for your cravings.',
  description text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  maps_url text not null default '',
  instagram_url text not null default '',
  logo_url text,
  hours jsonb not null default '[]'::jsonb,
  prep_minutes int not null default 12 check (prep_minutes between 0 and 240),
  ordering_enabled boolean not null default true,
  takeaway_enabled boolean not null default true,
  dine_in_enabled boolean not null default true,
  payment_methods jsonb not null default '[]'::jsonb,
  upi_id text not null default '',
  upi_name text not null default '',
  tax_percent numeric(5,2) not null default 0 check (tax_percent between 0 and 40),
  tax_label text not null default 'GST',
  gstin text not null default '',
  receipt_header text not null default '',
  receipt_footer text not null default 'Thank you for choosing Crème & Crust!',
  receipt_paper text not null default '80' check (receipt_paper in ('58','80')),
  currency text not null default 'INR',
  printer jsonb not null default '{"name":"Counter printer","connection":"browser","baud":9600}'::jsonb,
  accent_color text not null default '#C98243' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  demo_mode boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger shop_settings_touch before update on public.shop_settings for each row execute function touch_updated_at();

-- ───────────────────────── menu ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_touch before update on public.categories for each row execute function touch_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 80),
  description text not null default '' check (length(description) <= 400),
  price_paise int not null check (price_paise between 0 and 10000000),
  image_url text,
  is_available boolean not null default true,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  is_customizable boolean not null default true,
  sort_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id, sort_order);
create trigger products_touch before update on public.products for each row execute function touch_updated_at();

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 40),
  selection text not null default 'multi' check (selection in ('single','multi')),
  max_select int not null default 0 check (max_select between 0 and 20),
  required boolean not null default false,
  sort_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.option_groups(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 50),
  price_paise int not null default 0 check (price_paise between 0 and 1000000),
  is_active boolean not null default true,
  sort_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index options_group_idx on public.options(group_id, sort_order);

-- which add-on groups a product offers
create table public.product_option_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  group_id uuid not null references public.option_groups(id) on delete cascade,
  primary key (product_id, group_id)
);

-- ───────────────────────── coupons / offers ─────────────────────────
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,20}$'),
  title text not null default '',
  description text not null default '',
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value int not null check (discount_value > 0),
  max_discount_paise int check (max_discount_paise is null or max_discount_paise > 0),
  min_order_paise int not null default 0 check (min_order_paise >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  show_on_site boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);
create trigger coupons_touch before update on public.coupons for each row execute function touch_updated_at();

-- ───────────────────────── orders ─────────────────────────
create sequence public.receipt_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  client_ref uuid unique,
  customer_name text not null,
  phone text not null,
  order_type text not null check (order_type in ('takeaway','dine_in')),
  table_label text,
  notes text not null default '',
  payment_method text not null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  status text not null default 'new' check (status in ('new','accepted','preparing','ready','completed','cancelled')),
  subtotal_paise int not null default 0 check (subtotal_paise >= 0),
  discount_paise int not null default 0 check (discount_paise >= 0),
  tax_paise int not null default 0 check (tax_paise >= 0),
  total_paise int not null default 0 check (total_paise >= 0),
  tax_percent numeric(5,2) not null default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  discount_label text,
  source text not null default 'online' check (source in ('online','counter')),
  created_by uuid references auth.users(id) on delete set null,
  cancel_reason text,
  receipt_no text unique,
  inventory_deducted_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz, preparing_at timestamptz, ready_at timestamptz,
  completed_at timestamptz, cancelled_at timestamptz
);
create index orders_status_idx on public.orders(status, created_at desc);
create index orders_created_idx on public.orders(created_at desc);
create index orders_phone_idx on public.orders(phone, created_at desc);
create index orders_receipt_idx on public.orders(receipt_no);

-- permanent deletions are rare, owner-only and leave an audit trail
create table public.deleted_bills_log (
  id bigint generated always as identity primary key,
  order_number text not null,
  receipt_no text,
  total_paise int not null,
  snapshot jsonb not null,
  reason text not null,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now()
);
create trigger orders_touch before update on public.orders for each row execute function touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  category_name text not null default '',
  base_price_paise int not null,
  options_price_paise int not null default 0,
  unit_price_paise int not null,
  quantity int not null check (quantity between 1 and 50),
  line_total_paise int not null,
  notes text not null default '',
  position int not null default 0
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_id uuid references public.options(id) on delete set null,
  group_name text not null,
  option_name text not null,
  price_paise int not null
);
create index order_item_options_item_idx on public.order_item_options(order_item_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id, created_at);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  receipt_no text not null,
  kind text not null check (kind in ('original','reprint')),
  method text not null check (method in ('browser','simulated','serial','bluetooth')),
  status text not null check (status in ('sent_to_browser','simulated','printed','failed')),
  paper text not null check (paper in ('58','80')),
  printed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index receipts_order_idx on public.receipts(order_id, created_at desc);

-- ───────────────────────── inventory ─────────────────────────
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 60),
  unit text not null default 'pcs' check (length(unit) between 1 and 12),
  quantity numeric(12,2) not null default 0 check (quantity >= 0),
  low_threshold numeric(12,2) not null default 0 check (low_threshold >= 0),
  unit_cost_paise int check (unit_cost_paise is null or unit_cost_paise >= 0),
  is_demo boolean not null default false,
  demo_default_quantity numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger inventory_items_touch before update on public.inventory_items for each row execute function touch_updated_at();

create table public.inventory_transactions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  change numeric(12,2) not null,
  quantity_after numeric(12,2) not null,
  reason text not null check (reason in ('restock','usage','waste','count','order','demo_restore')),
  order_id uuid references public.orders(id) on delete cascade,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_tx_item_idx on public.inventory_transactions(item_id, created_at desc);
create index inventory_tx_order_idx on public.inventory_transactions(order_id);

-- recipe: how much of each ingredient one unit of a product uses
create table public.product_ingredients (
  product_id uuid not null references public.products(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity numeric(10,3) not null check (quantity > 0),
  primary key (product_id, item_id)
);

-- ───────────────────────── row level security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.shop_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.order_status_history enable row level security;
alter table public.receipts enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.deleted_bills_log enable row level security;
create policy deleted_log_read on public.deleted_bills_log for select to authenticated using (is_owner());

-- profiles: you see yourself; owner sees the team. Changes only through owner RPCs.
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or is_owner());

-- public menu + settings are readable by everyone; only the owner edits them
create policy settings_read on public.shop_settings for select to anon, authenticated using (true);
create policy settings_write on public.shop_settings for update to authenticated using (is_owner()) with check (is_owner());

create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_ins on public.categories for insert to authenticated with check (is_owner());
create policy categories_upd on public.categories for update to authenticated using (is_owner()) with check (is_owner());

create policy products_read on public.products for select to anon, authenticated using (true);
create policy products_ins on public.products for insert to authenticated with check (is_owner());
create policy products_upd on public.products for update to authenticated using (is_owner()) with check (is_owner());
create policy products_del on public.products for delete to authenticated using (is_owner());

create policy groups_read on public.option_groups for select to anon, authenticated using (true);
create policy groups_ins on public.option_groups for insert to authenticated with check (is_owner());
create policy groups_upd on public.option_groups for update to authenticated using (is_owner()) with check (is_owner());
create policy groups_del on public.option_groups for delete to authenticated using (is_owner());

create policy options_read on public.options for select to anon, authenticated using (true);
create policy options_ins on public.options for insert to authenticated with check (is_owner());
create policy options_upd on public.options for update to authenticated using (is_owner()) with check (is_owner());
create policy options_del on public.options for delete to authenticated using (is_owner());

create policy pog_read on public.product_option_groups for select to anon, authenticated using (true);
create policy pog_ins on public.product_option_groups for insert to authenticated with check (is_owner());
create policy pog_del on public.product_option_groups for delete to authenticated using (is_owner());

-- coupons are private (codes are validated through RPCs); owner manages them
create policy coupons_read on public.coupons for select to authenticated using (is_owner());
create policy coupons_ins on public.coupons for insert to authenticated with check (is_owner());
create policy coupons_upd on public.coupons for update to authenticated using (is_owner()) with check (is_owner());
create policy coupons_del on public.coupons for delete to authenticated using (is_owner() and used_count = 0);

-- orders: staff can read; all writes go through security-definer RPCs
create policy orders_read on public.orders for select to authenticated using (is_staff());
create policy order_items_read on public.order_items for select to authenticated using (is_staff());
create policy order_item_options_read on public.order_item_options for select to authenticated using (is_staff());
create policy history_read on public.order_status_history for select to authenticated using (is_staff());
create policy receipts_read on public.receipts for select to authenticated using (is_staff());

create policy inv_read on public.inventory_items for select to authenticated using (is_staff());
create policy inv_ins on public.inventory_items for insert to authenticated with check (is_owner());
create policy inv_upd on public.inventory_items for update to authenticated using (is_owner()) with check (is_owner());
create policy inv_del on public.inventory_items for delete to authenticated using (is_owner());
create policy invtx_read on public.inventory_transactions for select to authenticated using (is_staff());

create policy ingr_read on public.product_ingredients for select to authenticated using (is_staff());
create policy ingr_ins on public.product_ingredients for insert to authenticated with check (is_owner());
create policy ingr_upd on public.product_ingredients for update to authenticated using (is_owner()) with check (is_owner());
create policy ingr_del on public.product_ingredients for delete to authenticated using (is_owner());

-- explicit grants (RLS still decides row access)
grant usage on schema public to anon, authenticated;
grant select on public.shop_settings, public.categories, public.products, public.option_groups, public.options, public.product_option_groups to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.option_groups, public.options, public.product_option_groups, public.coupons, public.inventory_items, public.product_ingredients to authenticated;
grant update on public.shop_settings to authenticated;
grant select on public.profiles, public.orders, public.order_items, public.order_item_options, public.order_status_history, public.receipts, public.inventory_transactions, public.deleted_bills_log to authenticated;
revoke insert, update, delete on public.orders, public.order_items, public.order_item_options, public.order_status_history, public.receipts, public.inventory_transactions, public.profiles, public.deleted_bills_log from anon, authenticated;

-- ───────────────────────── storage for product images ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "product images owner insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_owner());
create policy "product images owner update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_owner());
create policy "product images owner delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_owner());

-- realtime for the order board
alter publication supabase_realtime add table public.orders;
