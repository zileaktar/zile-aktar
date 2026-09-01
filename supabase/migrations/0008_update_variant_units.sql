-- ================================================================
-- VARYANT BİRİMLERİNİ GÜNCELLEME — kullanıcının güncellenmiş CSV'sinde artık
-- Miktar/Birim sütunları var: 93 üründen 91'i "1 Adet", 2'si (Ham Bal, Karakovan
-- Balı) "kg" cinsinden. Fiyat/stok değerleri DEĞİŞMEDİ, yalnızca etiket düzeltiliyor.
--
-- '-STD' SKU son eki YALNIZCA 0007 migration'ında eklenen 89 üründe kullanıldı
-- (orijinal 19 demo ürün '-250G'/'-500ML' gibi farklı bir son ek kullanıyor),
-- bu yüzden bu güncelleme onlara dokunmaz.
-- ================================================================

update public.product_variants set label = '1 Adet' where sku like '%-STD';

-- Ham Bal zaten 0007'de eklenmişti ("500g" olarak); doğru birime (5 kg) çekiliyor.
update public.product_variants set label = '5 kg' where sku = 'HAM-BAL-STD';

-- Karakovan Balı, mevcut demo ürünüyle aynı isimde olduğu için 0007'de hiç
-- eklenmemişti (bkz. o migration'ın başındaki not) — mevcut 250g/500g
-- varyantları korunuyor, kullanıcının verdiği yeni "10 kg" seçeneği EKLENİYOR.
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
select id, 'KARAKOVAN-BALI-10KG', '10 kg', 75000, 12, 3
from public.products where slug = 'karakovan-bali'
on conflict (sku) do nothing;
