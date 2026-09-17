-- ================================================================
-- "TERK EDİLMİŞ SEPET" HATIRLATMA E-POSTASI
--
-- Sepet yalnızca tarayıcıda (localStorage) tutulduğundan sunucu gerçek
-- anlamda "sepete eklendi ama hiç ödemeye geçilmedi" anını bilemez. Bunun
-- yerine, pratikte aynı işi gören ve GERÇEK veriyle çalışan senaryo
-- hedeflenir: müşteri ödemeye BAŞLADI (kart sayfasına yönlendi) ama
-- TAMAMLAMADI. Bu siparişler zaten `pending` durumda DB'de duruyor; 24 saat
-- sonra `expire-pending-orders` cron'u onları otomatik iptal ediyordu —
-- şimdi iptalden ÖNCE bir hatırlatma e-postası eklenir.
--
-- `reminder_sent_at`: aynı siparişe iki kez hatırlatma gitmesin diye.
-- ================================================================

alter table public.orders
  add column if not exists reminder_sent_at timestamptz;
