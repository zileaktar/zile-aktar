-- ================================================================
-- RLS PERFORMANS OPTİMİZASYONU
-- Supabase'in resmi önerisi: bir RLS politikasında `auth.uid()` doğrudan
-- kullanılırsa, Postgres onu potansiyel olarak HER SATIR için yeniden
-- değerlendirebilir (volatile fonksiyon çağrısı gibi ele alınır). Bunu
-- `(select auth.uid())` şeklinde bir alt sorguya sarmak, Postgres'in bunu
-- sorgu başına BİR KEZ hesaplayıp sabit bir değer olarak önbelleğe almasına
-- izin verir — tablo büyüdükçe (yüzlerce/binlerce satır) fark yaratan,
-- belgelenmiş bir performans kazanımıdır:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Bu migration, 0002_rls_policies.sql'deki TÜM politikaları ve yardımcı
-- fonksiyonları aynı mantıkla ama optimize edilmiş ifadeyle yeniden oluşturur.
-- Davranışta hiçbir değişiklik YOKTUR — yalnızca sorgu planlayıcısının işi azalır.
-- ================================================================

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---- PROFILES ----
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = (select auth.uid()) or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'user');

drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff" on public.profiles
  for update using (public.is_admin());

-- ---- ADDRESSES ----
drop policy if exists "addresses_all_own" on public.addresses;
create policy "addresses_all_own" on public.addresses
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---- CARTS / CART_ITEMS ----
drop policy if exists "carts_all_own" on public.carts;
create policy "carts_all_own" on public.carts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "cart_items_all_own" on public.cart_items;
create policy "cart_items_all_own" on public.cart_items
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---- ORDERS ----
drop policy if exists "orders_select_own_or_staff" on public.orders;
create policy "orders_select_own_or_staff" on public.orders
  for select using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists "order_items_select_own_or_staff" on public.order_items;
create policy "order_items_select_own_or_staff" on public.order_items
  for select using (
    public.is_staff() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

-- ---- DATA REQUESTS ----
drop policy if exists "data_requests_select_own_or_staff" on public.data_requests;
create policy "data_requests_select_own_or_staff" on public.data_requests
  for select using (user_id = (select auth.uid()) or public.is_staff());

-- Not: categories/products/product_variants/orders_staff_update politikaları
-- zaten yalnızca public.is_staff()/is_admin() çağırıyordu (çıplak auth.uid()
-- kullanmıyordu), bu yüzden burada tekrar tanımlanmadı — değişiklikleri yalnızca
-- yukarıdaki fonksiyon güncellemesinden (is_staff/is_admin içindeki auth.uid())
-- dolaylı olarak faydalanıyorlar.
