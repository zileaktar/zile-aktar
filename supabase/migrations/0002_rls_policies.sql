-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- Varsayılan davranış: RLS açık olan bir tabloda politika yoksa HİÇBİR satır
-- görünmez/değiştirilemez (service_role hariç). Her tablo için "en az yetki"
-- prensibiyle açık politika tanımlanır.
-- ================================================================

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.webhook_events enable row level security; -- policy yok = yalnızca service_role erişir
alter table public.data_requests enable row level security;

-- Yardımcı fonksiyon: çağıran kullanıcı admin veya moderator mü?
create function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'user'); -- kullanıcı kendi rolünü yükseltemez

create policy "profiles_update_staff" on public.profiles
  for update using (public.is_admin());

-- ----------------------------------------------------------------
-- ADDRESSES — yalnızca sahibi CRUD yapabilir
-- ----------------------------------------------------------------
create policy "addresses_all_own" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- CATEGORIES / PRODUCTS / VARIANTS — herkes okuyabilir, sadece staff yazabilir
-- ----------------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "categories_staff_write" on public.categories
  for insert with check (public.is_staff());
create policy "categories_staff_update" on public.categories
  for update using (public.is_staff());
create policy "categories_staff_delete" on public.categories
  for delete using (public.is_admin());

create policy "products_public_read_active" on public.products
  for select using (is_active = true or public.is_staff());
create policy "products_staff_write" on public.products
  for insert with check (public.is_staff());
create policy "products_staff_update" on public.products
  for update using (public.is_staff());
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

create policy "variants_public_read" on public.product_variants
  for select using (true);
create policy "variants_staff_write" on public.product_variants
  for insert with check (public.is_staff());
create policy "variants_staff_update" on public.product_variants
  for update using (public.is_staff());
create policy "variants_admin_delete" on public.product_variants
  for delete using (public.is_admin());

-- ----------------------------------------------------------------
-- CARTS / CART_ITEMS — yalnızca sahibi
-- ----------------------------------------------------------------
create policy "carts_all_own" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cart_items_all_own" on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- ORDERS — kullanıcı yalnızca kendi siparişlerini görür; INSERT client'tan YASAK
-- (sipariş oluşturma yalnızca /api/checkout üzerinden service_role ile,
-- sunucu tarafında fiyat/stok doğrulaması yapıldıktan sonra gerçekleşir).
-- ----------------------------------------------------------------
create policy "orders_select_own_or_staff" on public.orders
  for select using (user_id = auth.uid() or public.is_staff());

create policy "orders_staff_update" on public.orders
  for update using (public.is_staff());

-- Not: INSERT/DELETE politikası kasıtlı olarak tanımlanmadı → client asla
-- doğrudan sipariş oluşturamaz/silemez, yalnızca service_role (API route) yapabilir.

create policy "order_items_select_own_or_staff" on public.order_items
  for select using (
    public.is_staff() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- DATA REQUESTS (KVKK) — kullanıcı yalnızca kendi taleplerini görür
-- ----------------------------------------------------------------
create policy "data_requests_select_own_or_staff" on public.data_requests
  for select using (user_id = auth.uid() or public.is_staff());
