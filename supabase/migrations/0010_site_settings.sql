-- ================================================================
-- SİTE AYARLARI — tekil satır (singleton) deseni. `id boolean primary key
-- default true check (id)` yalnızca TEK bir satırın var olabilmesini garanti
-- eder (id ya true'dur ya da satır hiç yoktur; false asla eklenemez).
-- Şimdilik yalnızca logo yolu tutuyor, ileride başka site geneli ayarlar
-- (örn. WhatsApp numarası) buraya eklenebilir.
-- ================================================================

create table public.site_settings (
  id boolean primary key default true,
  logo_path text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id)
);

insert into public.site_settings (id, logo_path) values (true, null);

create trigger trg_site_settings_updated_at before update on public.site_settings
  for each row execute procedure public.set_updated_at();

alter table public.site_settings enable row level security;

-- Herkes okuyabilir (logo her sayfada, tüm ziyaretçilere gösterilir).
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

-- Yalnızca admin güncelleyebilir (moderator değil) — site markası/logosu gibi
-- global bir ayar, günlük ürün/sipariş yönetiminden daha hassas kabul edilir.
-- Satır zaten seed ile oluşturulduğundan insert/delete politikasına gerek yok.
create policy "site_settings_admin_update" on public.site_settings
  for update using (public.is_admin());
