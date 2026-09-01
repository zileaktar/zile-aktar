-- ================================================================
-- AKTAR SEKTÖRÜ ALANLARI + YORUMLAR + HAVALE/EFT ALTYAPISI
--
-- Tümü EKLEMELİDİR (additive) — mevcut şema/veri bozulmaz. Yeni sütunlar
-- nullable veya makul default ile eklenir; eski satırlar geçerliliğini korur.
-- ================================================================

-- ----------------------------------------------------------------
-- 1) ÜRÜN: aktar sektörüne özel alanlar
-- ----------------------------------------------------------------
do $$ begin
  create type public.product_form as enum
    ('toz','tane','yaprak','cicek','kok','kabuk','yag','sivi','recine','sabun','macun','diger');
exception when duplicate_object then null;
end $$;

alter table public.products
  add column if not exists form            public.product_form,
  add column if not exists origin          text,
  add column if not exists storage_info    text not null default 'Serin, kuru ve güneş görmeyen yerde, ağzı kapalı saklayınız.',
  add column if not exists allergen_info   text,
  add column if not exists shelf_life_note text;

create index if not exists idx_products_form on public.products(form) where is_active;

-- ----------------------------------------------------------------
-- 2) VARYANT: parti/lot numarası + son tüketim tarihi
-- ----------------------------------------------------------------
alter table public.product_variants
  add column if not exists lot_no      text,
  add column if not exists expiry_date date;

-- ----------------------------------------------------------------
-- 3) SİPARİŞ: fatura adresi (NULL ise teslimat adresi = fatura adresi)
-- ----------------------------------------------------------------
alter table public.orders
  add column if not exists billing_address jsonb;

-- ----------------------------------------------------------------
-- 4) SITE AYARLARI: Havale/EFT banka bilgisi (checkout başarı sayfasında gösterilir)
-- ----------------------------------------------------------------
alter table public.site_settings
  add column if not exists bank_account_holder text,
  add column if not exists bank_name           text,
  add column if not exists bank_iban           text,
  add column if not exists bank_note           text;

-- ----------------------------------------------------------------
-- 5) ÜRÜN YORUMLARI (moderasyonlu)
-- ----------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  order_id   uuid references public.orders(id) on delete set null,
  rating     smallint not null check (rating between 1 and 5),
  title      text check (title is null or char_length(title) <= 120),
  body       text not null check (char_length(body) between 3 and 2000),
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists idx_reviews_product_approved on public.reviews(product_id) where status = 'approved';
create index if not exists idx_reviews_status on public.reviews(status);

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute procedure public.set_updated_at();

alter table public.reviews enable row level security;

-- Herkes ONAYLI yorumları görür; kullanıcı kendi (bekleyen) yorumunu, staff hepsini görür.
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews
  for select using (status = 'approved' or user_id = (select auth.uid()) or public.is_staff());

-- Kullanıcı yalnızca KENDİ adına yorum ekler (giriş zorunlu).
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (user_id = (select auth.uid()));

-- Kullanıcı henüz onaylanmamış kendi yorumunu düzeltebilir; rolü/onay durumunu değiştiremez.
drop policy if exists "reviews_update_own_pending" on public.reviews;
create policy "reviews_update_own_pending" on public.reviews
  for update using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending');

-- Staff onaylar/reddeder.
drop policy if exists "reviews_moderate_staff" on public.reviews;
create policy "reviews_moderate_staff" on public.reviews
  for update using (public.is_staff());

drop policy if exists "reviews_delete_staff" on public.reviews;
create policy "reviews_delete_staff" on public.reviews
  for delete using (public.is_admin());

-- ----------------------------------------------------------------
-- 6) SİPARİŞ RPC: Havale/EFT ödeme yöntemini de kabul et
--    create_order zaten p_payment_provider'ı parametre olarak alıyor; ek bir şey
--    gerekmez. Havale siparişleri de 'pending' durumunda oluşur — operasyon ekibi
--    ödeme dekontunu görünce admin panelinden 'paid' yapar.
-- ----------------------------------------------------------------
-- (değişiklik yok — not amaçlı)
