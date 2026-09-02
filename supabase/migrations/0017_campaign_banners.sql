-- ================================================================
-- KAMPANYA / DUYURU AFİŞLERİ (anasayfa carousel'i)
--
-- Anasayfanın en üstündeki kaydırmalı afiş şeridini besler. Görsel zorunlu;
-- başlık/alt başlık/bağlantı/buton metni opsiyonel (yalnızca görsel de olur).
-- `is_active=false` afişler sitede görünmez ama panelde durur.
-- ================================================================

create table if not exists public.campaign_banners (
  id          uuid primary key default gen_random_uuid(),
  title       text check (title is null or char_length(title) <= 120),
  subtitle    text check (subtitle is null or char_length(subtitle) <= 240),
  image_path  text not null,
  link_url    text check (link_url is null or char_length(link_url) <= 500),
  cta_label   text check (cta_label is null or char_length(cta_label) <= 40),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_campaign_banners_active on public.campaign_banners(sort_order, created_at) where is_active;

drop trigger if exists trg_campaign_banners_updated_at on public.campaign_banners;
create trigger trg_campaign_banners_updated_at before update on public.campaign_banners
  for each row execute procedure public.set_updated_at();

alter table public.campaign_banners enable row level security;

-- Aktif afişleri herkes okur; staff hepsini (pasifler dahil) görür.
drop policy if exists "campaign_banners_public_read" on public.campaign_banners;
create policy "campaign_banners_public_read" on public.campaign_banners
  for select using (is_active or public.is_staff());

-- Ekleme/güncelleme/silme yalnızca staff.
drop policy if exists "campaign_banners_staff_write" on public.campaign_banners;
create policy "campaign_banners_staff_write" on public.campaign_banners
  for all using (public.is_staff()) with check (public.is_staff());
