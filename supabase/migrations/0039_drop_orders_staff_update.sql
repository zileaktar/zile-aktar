-- ================================================================
-- 0039 — Siparişlerde kullanılmayan, sütun sınırı olmayan personel
-- güncelleme yetkisini kaldır (Supabase güvenlik denetimi, 6 Ekim).
--
-- `orders_staff_update` (0002) personele — moderatör dahil — siparişin HER
-- sütununu (tutar, müşteri, durum, ödeme referansı) değiştirme izni veriyordu.
-- Uygulamada hiçbir kod bu kuralı kullanmıyor: sipariş güncellemeleri (durum,
-- kargo, iptal/iade, ödeme onayı, hatırlatma) sunucu tarafında service_role
-- ile yapılıyor (RLS'i zaten bypass eder). Kural kaldırılınca hiçbir özellik
-- etkilenmez; yalnızca oturum çerezli bir personel hesabının doğrudan API ile
-- sipariş değiştirebilmesi kapanır (en az yetki ilkesi).
-- ================================================================

drop policy if exists "orders_staff_update" on public.orders;
