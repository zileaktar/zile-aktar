-- 0042 — Supabase güvenlik denetiminden (6 Ekim) kalan iki isteğe bağlı temizlik.
--
-- 1) reviews: anonim ziyaretçi onaylı yorumların user_id / order_id sütunlarını
--    okuyamasın. RLS satırı (status='approved') açık tutuyor; sütun yetkisi ise
--    tablo düzeyindeydi, yani `select=*` ile yorum yazarının kullanıcı ve sipariş
--    kimlikleri (UUID) görülebiliyordu. Kişisel veri değil ama gereksiz bilgi.
--    Site yalnızca id, rating, title, body, author_name, created_at okuyor
--    (src/lib/data/reviews.ts). Giriş yapmış kullanıcılara (authenticated) dokunulmadı:
--    kendi yorumunu user_id ile arıyor (getReviewContext) ve yorum eklerken
--    user_id/order_id yazıyor. RLS politika ifadeleri sütun yetkisinden etkilenmez.
--
-- 2) webhook_events: iyzico döneminden kalan, hiç kullanılmayan boş tablo
--    (VakıfBank dönüşü bu tabloyu kullanmıyor). Kaldırılıyor.

revoke select on public.reviews from anon;
grant select (id, product_id, rating, title, body, author_name, status, created_at, updated_at)
  on public.reviews to anon;

drop table if exists public.webhook_events;
