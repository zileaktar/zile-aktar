-- ================================================================
-- KARGO TAKİP BİLGİSİ
--
-- Yönetici siparişi "kargoya verildi" durumuna alırken kargo firması ve
-- takip numarası girer; bu bilgi müşteriye e-posta ile gönderilir.
-- Sütunlar opsiyoneldir (havale/kart farketmez, sipariş oluşurken boştur).
-- ================================================================

alter table public.orders add column if not exists shipping_carrier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists shipped_at timestamptz;
