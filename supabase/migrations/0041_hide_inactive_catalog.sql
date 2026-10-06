-- ================================================================
-- 0041 — Pasif kategori ve pasif ürünlerin varyantlarını ziyaretçiden gizle
-- (Supabase güvenlik denetimi, 6 Ekim — canlı anon testi).
--
-- Önce: `categories_public_read` ve `variants_public_read` = using (true) →
-- satıştan kaldırılmış (is_active=false) kategoriler ve pasif ürünlerin
-- varyantları (fiyat, stok, lot no, son kullanma) API'den herkese okunuyordu.
-- Sonra: ziyaretçi/üye yalnızca AKTİF olanları görür; personel (is_staff, aal2)
-- hepsini görmeye devam eder.
--
-- Etkilenmeyenler: vitrin sorguları zaten yalnız aktif ürün/kategori ister;
-- yönetim paneli sayfaları service_role (RLS'siz) ya da personel oturumuyla
-- çalışır; kupon önizleme, create_order, Telegram stok uyarısı service_role.
-- `(select public.is_staff())`: satır başına değil sorgu başına bir kez
-- çalışsın diye (0006'daki RLS performans deseni).
-- ================================================================

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active or (select public.is_staff()));

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
  for select using (
    (select public.is_staff())
    or exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_active
    )
  );
