-- ================================================================
-- KÖKTEN AKTAR — Başlangıç Şeması
-- Tüm parasal alanlar KURUŞ cinsinden INTEGER olarak tutulur (float yuvarlama
-- hatalarını önlemek için). 1 TL = 100 kuruş. Örn: 34000 = 340,00 TL.
-- ================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- ROLLER
-- ----------------------------------------------------------------
create type public.user_role as enum ('admin', 'moderator', 'user');
create type public.order_status as enum ('pending', 'paid', 'failed', 'shipped', 'delivered', 'cancelled', 'refunded');

-- ----------------------------------------------------------------
-- PROFILES — auth.users tablosunu genişletir (1:1 ilişki)
-- ----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'user',
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on public.profiles(role);

-- Yeni auth.users kaydı oluşunca otomatik profiles satırı aç.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- ADRESLER
-- ----------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Ev',
  full_name text not null,
  phone text not null,
  city text not null,
  district text not null,
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_addresses_user_id on public.addresses(user_id);

-- ----------------------------------------------------------------
-- KATEGORİLER
-- ----------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_categories_slug on public.categories(slug);

-- ----------------------------------------------------------------
-- ÜRÜNLER
-- ----------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_path text not null, -- Supabase Storage içindeki obje yolu (public URL değil)
  badges text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Gerçek bir sütun olarak saklanan tsvector: PostgREST'in .textSearch() metodu
  -- yalnızca somut bir sütuna (ifadeye değil) karşı sorgu kurabilir; bu yüzden
  -- arama, bir ifade indeksi yerine bu GENERATED sütun üzerinden yapılır.
  search_vector tsvector generated always as (
    to_tsvector('turkish', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored
);
create index idx_products_category_id on public.products(category_id);
create index idx_products_is_active on public.products(is_active);
create index idx_products_search on public.products using gin (search_vector);

-- ----------------------------------------------------------------
-- ÜRÜN VARYANTLARI (Gramaj/Boyut bazlı fiyat & stok)
-- ----------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  label text not null, -- Örn: "250g", "500ml"
  price_cents integer not null check (price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, label)
);
create index idx_product_variants_product_id on public.product_variants(product_id);

-- ----------------------------------------------------------------
-- SEPET (Oturum açmış kullanıcılar için cihazlar arası kalıcı sepet)
-- ----------------------------------------------------------------
create table public.carts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.carts(user_id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, variant_id)
);
create index idx_cart_items_user_id on public.cart_items(user_id);

-- ----------------------------------------------------------------
-- SİPARİŞLER
-- ----------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'TRY',
  shipping_address jsonb not null, -- Sipariş anındaki adres anlık görüntüsü (adres sonradan değişse de sipariş etkilenmez)
  payment_provider text not null default 'iyzico',
  payment_conversation_id text, -- iyzico conversationId — webhook eşleştirmesi için
  payment_ref text,
  contact_email text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_payment_conversation_id on public.orders(payment_conversation_id);
create unique index idx_orders_order_number on public.orders(order_number);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  -- Anlık görüntü alanları: ürün adı/fiyatı sonradan değişse bile geçmiş siparişler bozulmaz.
  product_name_snapshot text not null,
  variant_label_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity > 0)
);
create index idx_order_items_order_id on public.order_items(order_id);

-- ----------------------------------------------------------------
-- WEBHOOK İDEMPOTENCY — aynı olayın iki kez işlenmesini engeller
-- ----------------------------------------------------------------
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- ----------------------------------------------------------------
-- KVKK VERİ TALEPLERİ (export / silme taleplerinin denetim izi)
-- ----------------------------------------------------------------
-- user_id kasıtlı olarak "on delete set null" — bir kullanıcı hesabını sildiğinde
-- bu denetim kaydı da SİLİNİRSE "silme talebini yerine getirdik" kanıtı kaybolur.
-- Yasal ispat için e-posta anlık görüntüsü ayrıca saklanır.
create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email_snapshot text not null,
  type text not null check (type in ('export', 'delete')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);
create index idx_data_requests_user_id on public.data_requests(user_id);

-- updated_at otomatik güncelleme tetikleyicisi
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();
