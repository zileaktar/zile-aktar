-- ================================================================
-- YORUM YAZAR ADI (anlık görüntü)
--
-- RLS `profiles_select_own_or_staff` bir kullanıcının BAŞKA bir kullanıcının
-- profilini (adını) okumasını engeller. Onaylı yorumları herkese gösterirken
-- yazarın adını da göstermek için, order_items'taki desenin aynısı: yorum
-- oluşturulurken yazarın adı reviews satırına KOPYALANIR.
-- ================================================================

alter table public.reviews add column if not exists author_name text not null default 'Zile Aktar Müşterisi';
