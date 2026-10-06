-- ================================================================
-- 0040 — Supabase Security Advisor uyarılarının düzeltmesi (6 Ekim)
--
-- 1) function_search_path_mutable: set_updated_at'in search_path'i sabitlenir
--    (aksi halde çağıranın search_path'ine göre farklı nesne çözümleyebilir).
-- 2) public_bucket_allows_listing: "product-images" PUBLIC bir kova — dosyalar
--    /storage/v1/object/public/... adresiyle RLS'siz servis edilir; geniş SELECT
--    kuralı yalnızca herkesin TÜM dosyaları LİSTELEMESİNE yarıyordu. Kaldırılır.
--    Görsel gösterimi, next/image, imzalı URL ile yükleme ETKİLENMEZ (yükleme
--    service_role'la imzalanır; staff update/delete kuralları ayrı ve duruyor).
-- 3) anon/authenticated SECURITY DEFINER çalıştırabiliyor:
--    - TETİKLEYİCİ fonksiyonlar (handle_new_user, enforce_single_default_address,
--      reviews_enforce_defaults) API'den çağrılmamalı. PostgreSQL EXECUTE yetkisini
--      tetikleyici OLUŞTURULURKEN kontrol eder, ÇALIŞIRKEN değil — kayıt (profil
--      oluşturma), varsayılan adres ve yorum ekleme davranışı değişmez.
--    - rls_auto_enable: Supabase'in "yeni tablolarda RLS'i otomatik aç" olay
--      tetikleyicisi fonksiyonu (bizim migration'larımızda yok) — varsa kapatılır.
--    - is_staff / is_admin / my_role BİLİNÇLİ OLARAK AÇIK KALIR: RLS kuralları bu
--      fonksiyonları çağıranın (anon/authenticated) yetkisiyle çalıştırır; kapatmak
--      tüm sorguları kırar. Yalnızca ÇAĞIRANIN KENDİ rolünü döndürürler.
-- ================================================================

alter function public.set_updated_at() set search_path = public;

drop policy if exists "product_images_public_read" on storage.objects;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_single_default_address() from public, anon, authenticated;
revoke execute on function public.reviews_enforce_defaults() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace and pronargs = 0
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
