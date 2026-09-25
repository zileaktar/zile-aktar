-- ================================================================
-- PERSONEL YETKİSİ İÇİN İKİ ADIMLI DOĞRULAMA (AAL2) ŞARTI — RLS KATMANI
--
-- Uygulama katmanında admin paneli, AAL2 (TOTP ile doğrulanmış) oturum
-- olmadan açılmıyor (middleware + admin layout + her aksiyonda assertAal2).
-- Bu migration aynı kuralı VERİTABANINDA da uygular: is_staff()/is_admin()
-- yalnızca oturum JWT'sinin `aal` alanı 'aal2' ise true döner.
--
-- Sonuç: bir personelin şifresi çalınsa bile, iki adımlı doğrulamayı
-- geçmemiş bir oturum (AAL1) RLS'te sıradan bir müşteri gibi davranır —
-- yalnızca kendi satırlarını görür, ürün/sipariş/kupon yönetemez.
--
-- service_role istemcisi RLS'i zaten atlar; bu yüzden service_role ile
-- çalışan sunucu kodları (webhook, cron, admin sayfa okumaları) bu
-- değişiklikten ETKİLENMEZ — onlar uygulama katmanındaki assertAal2 ile
-- korunur.
--
-- `(select ...)` sarmalayıcıları 0006'daki RLS performans deseniyle aynı:
-- Postgres ifadeyi satır başına değil sorgu başına bir kez değerlendirir.
-- ================================================================

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (
       select 1 from public.profiles
       where id = (select auth.uid()) and role in ('admin', 'moderator')
     );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (
       select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
     );
$$;
