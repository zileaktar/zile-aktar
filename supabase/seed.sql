-- ================================================================
-- GELİŞTİRME/DEMO SEED VERİSİ
-- image_path alanında bu seed'de Unsplash URL'leri kullanılıyor (gerçek ürün
-- fotoğrafları henüz yüklenmediği için). Üretimde admin panelinden
-- /api/upload/presigned-url akışıyla Storage'a yüklenen dosyaların
-- "product-images/<dosya>" yolu buraya yazılır. src/lib/media.ts içindeki
-- getProductImageUrl() her iki formatı da (tam URL veya storage yolu) çözer.
-- ================================================================

insert into public.categories (slug, name, sort_order) values
  ('yoresel', 'Yöresel Ürünler', 1),
  ('baharat', 'Taze Baharatlar', 2),
  ('macun', 'Özel Macunlar & Bitkiler', 3),
  ('yag', 'Soğuk Sıkım & Botanik Yağlar', 4),
  ('cay', 'Şifalı Bitki Çayları', 5)
on conflict (slug) do nothing;

-- Yöresel Ürünler
with cat as (select id from public.categories where slug = 'yoresel')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('hakiki-anzer-bali', 'Hakiki Anzer Balı', 'Rize Anzer Yaylası''ndan, katkısız ve doğal süzme bal.', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=70', array['100% Doğal','Yöresel']),
  ('karakovan-bali', 'Karakovan Balı', 'Geleneksel kütük kovanlarda üretilen özel karakovan balı.', 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=600&q=70', array['Yöresel','Sınırlı Stok']),
  ('tas-baski-zeytinyagi', 'Taş Baskı Zeytinyağı', 'Ayvalık zeytininden soğuk sıkım erken hasat zeytinyağı.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=70', array['Soğuk Sıkım','100% Doğal']),
  ('dut-pekmezi', 'Dut Pekmezi', 'Malatya kara dutundan katkısız geleneksel pekmez.', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=600&q=70', array['Yöresel','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- Taze Baharatlar
with cat as (select id from public.categories where slug = 'baharat')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('tane-sumak', 'Tane Sumak', 'Elle toplanmış, doğal kurutulmuş tane sumak.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=70', array['Yöresel','100% Doğal']),
  ('yaprak-isirgan', 'Yaprak Isırgan', 'Gölgede kurutulmuş kuru ısırgan yaprağı.', 'https://images.unsplash.com/photo-1610460531513-48b08adff4d2?auto=format&fit=crop&w=600&q=70', array['100% Doğal']),
  ('corek-otu', 'Çörek Otu (Tane)', 'Bağışıklık destekçisi doğal çörek otu.', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=70', array['100% Doğal','Yöresel']),
  ('hakiki-safran', 'Hakiki Safran', 'Elle hasat edilmiş üstün kalite iplik safran.', 'https://images.unsplash.com/photo-1615885108069-7d5bef9a7e22?auto=format&fit=crop&w=600&q=70', array['Yöresel','Sınırlı Stok'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- Özel Macunlar & Bitkiler
with cat as (select id from public.categories where slug = 'macun')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('caksir-koku', 'Çakşır Kökü', 'Doğu Anadolu''ya özgü kurutulmuş doğal çakşır kökü.', 'https://images.unsplash.com/photo-1509442724476-1c7f5a2c9ec3?auto=format&fit=crop&w=600&q=70', array['Yöresel','100% Doğal']),
  ('caksir-macunu', 'Çakşır Macunu', 'Bal ve doğal bitkilerle harmanlanmış geleneksel macun.', 'https://images.unsplash.com/photo-1587049016823-c1b0a6c4f9a2?auto=format&fit=crop&w=600&q=70', array['Yöresel','Geleneksel']),
  ('epimedyumlu-karisim', 'Epimedyumlu Karışım', 'Epimedyum otu, bal, ceviz ile özel formül macun.', 'https://images.unsplash.com/photo-1600617288674-3247ea34c9d7?auto=format&fit=crop&w=600&q=70', array['Geleneksel','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- Soğuk Sıkım & Botanik Yağlar
with cat as (select id from public.categories where slug = 'yag')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('keten-tohumu-yagi', 'Keten Tohumu Yağı', 'Omega-3 açısından zengin, birinci soğuk sıkım.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=70', array['Soğuk Sıkım','100% Doğal']),
  ('kabak-cekirdegi-yagi', 'Kabak Çekirdeği Yağı', 'Ege bölgesi kabak çekirdeğinden soğuk sıkım yağ.', 'https://images.unsplash.com/photo-1615485291234-6b5b7a2c1e0f?auto=format&fit=crop&w=600&q=70', array['Soğuk Sıkım','Yöresel']),
  ('cam-terebentin-yagi', 'Çam Terebentin Yağı', 'Anadolu çamlarından elde edilen saf doğal yağ.', 'https://images.unsplash.com/photo-1601049676869-702ea24cfd58?auto=format&fit=crop&w=600&q=70', array['100% Doğal','Yöresel']),
  ('tatli-badem-yagi', 'Tatlı Badem Yağı', 'Cilt ve saç bakımında kullanılan birinci sıkım yağ.', 'https://images.unsplash.com/photo-1611080541599-8c6dbde6ea21?auto=format&fit=crop&w=600&q=70', array['Soğuk Sıkım','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- Şifalı Bitki Çayları
with cat as (select id from public.categories where slug = 'cay')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('kis-cayi-karisimi', 'Kış Çayı Karışımı', 'Zencefil, tarçın, karanfil ve portakal kabuğu karışımı.', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=70', array['Yöresel','100% Doğal']),
  ('papatya-cayi', 'Papatya Çayı', 'Doğal kurutulmuş, tam çiçek papatya.', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=70', array['100% Doğal']),
  ('ihlamur', 'Ihlamur (Dal Sürgün)', 'Elle toplanmış taze ıhlamur çiçeği.', 'https://images.unsplash.com/photo-1597481499547-9c1d1c1f9c7d?auto=format&fit=crop&w=600&q=70', array['Yöresel','100% Doğal']),
  ('biberiye-cayi', 'Biberiye Çayı', 'Akdeniz kökenli doğal kurutulmuş biberiye yaprakları.', 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=600&q=70', array['100% Doğal','Yöresel'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- Varyantlar (gramaj + fiyat[kuruş] + stok) — her ürün için
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
select p.id, upper(p.slug) || '-250G', '250g', 34000, 18, 1 from public.products p where p.slug = 'hakiki-anzer-bali'
union all select p.id, upper(p.slug) || '-500G', '500g', 62000, 18, 2 from public.products p where p.slug = 'hakiki-anzer-bali'
union all select p.id, upper(p.slug) || '-1000G', '1000g', 115000, 18, 3 from public.products p where p.slug = 'hakiki-anzer-bali'

union all select p.id, upper(p.slug) || '-250G', '250g', 29000, 7, 1 from public.products p where p.slug = 'karakovan-bali'
union all select p.id, upper(p.slug) || '-500G', '500g', 54000, 7, 2 from public.products p where p.slug = 'karakovan-bali'

union all select p.id, upper(p.slug) || '-500ML', '500ml', 28000, 24, 1 from public.products p where p.slug = 'tas-baski-zeytinyagi'
union all select p.id, upper(p.slug) || '-1000ML', '1000ml', 52000, 24, 2 from public.products p where p.slug = 'tas-baski-zeytinyagi'

union all select p.id, upper(p.slug) || '-350G', '350g', 16500, 15, 1 from public.products p where p.slug = 'dut-pekmezi'
union all select p.id, upper(p.slug) || '-700G', '700g', 30000, 15, 2 from public.products p where p.slug = 'dut-pekmezi'

union all select p.id, upper(p.slug) || '-100G', '100g', 6000, 40, 1 from public.products p where p.slug = 'tane-sumak'
union all select p.id, upper(p.slug) || '-250G', '250g', 13000, 40, 2 from public.products p where p.slug = 'tane-sumak'

union all select p.id, upper(p.slug) || '-50G', '50g', 4500, 33, 1 from public.products p where p.slug = 'yaprak-isirgan'
union all select p.id, upper(p.slug) || '-100G', '100g', 8000, 33, 2 from public.products p where p.slug = 'yaprak-isirgan'

union all select p.id, upper(p.slug) || '-100G', '100g', 5500, 55, 1 from public.products p where p.slug = 'corek-otu'
union all select p.id, upper(p.slug) || '-250G', '250g', 12000, 55, 2 from public.products p where p.slug = 'corek-otu'

union all select p.id, upper(p.slug) || '-1G', '1g', 18000, 9, 1 from public.products p where p.slug = 'hakiki-safran'
union all select p.id, upper(p.slug) || '-2G', '2g', 34000, 9, 2 from public.products p where p.slug = 'hakiki-safran'

union all select p.id, upper(p.slug) || '-100G', '100g', 9500, 14, 1 from public.products p where p.slug = 'caksir-koku'
union all select p.id, upper(p.slug) || '-250G', '250g', 21000, 14, 2 from public.products p where p.slug = 'caksir-koku'

union all select p.id, upper(p.slug) || '-250G', '250g', 38000, 11, 1 from public.products p where p.slug = 'caksir-macunu'
union all select p.id, upper(p.slug) || '-500G', '500g', 70000, 11, 2 from public.products p where p.slug = 'caksir-macunu'

union all select p.id, upper(p.slug) || '-250G', '250g', 42000, 10, 1 from public.products p where p.slug = 'epimedyumlu-karisim'
union all select p.id, upper(p.slug) || '-500G', '500g', 78000, 10, 2 from public.products p where p.slug = 'epimedyumlu-karisim'

union all select p.id, upper(p.slug) || '-250ML', '250ml', 15000, 26, 1 from public.products p where p.slug = 'keten-tohumu-yagi'
union all select p.id, upper(p.slug) || '-500ML', '500ml', 27000, 26, 2 from public.products p where p.slug = 'keten-tohumu-yagi'

union all select p.id, upper(p.slug) || '-250ML', '250ml', 19000, 22, 1 from public.products p where p.slug = 'kabak-cekirdegi-yagi'
union all select p.id, upper(p.slug) || '-500ML', '500ml', 35000, 22, 2 from public.products p where p.slug = 'kabak-cekirdegi-yagi'

union all select p.id, upper(p.slug) || '-100ML', '100ml', 11000, 19, 1 from public.products p where p.slug = 'cam-terebentin-yagi'
union all select p.id, upper(p.slug) || '-250ML', '250ml', 23000, 19, 2 from public.products p where p.slug = 'cam-terebentin-yagi'

union all select p.id, upper(p.slug) || '-100ML', '100ml', 12000, 30, 1 from public.products p where p.slug = 'tatli-badem-yagi'
union all select p.id, upper(p.slug) || '-250ML', '250ml', 25000, 30, 2 from public.products p where p.slug = 'tatli-badem-yagi'

union all select p.id, upper(p.slug) || '-100G', '100g', 7500, 45, 1 from public.products p where p.slug = 'kis-cayi-karisimi'
union all select p.id, upper(p.slug) || '-250G', '250g', 16000, 45, 2 from public.products p where p.slug = 'kis-cayi-karisimi'

union all select p.id, upper(p.slug) || '-50G', '50g', 4000, 50, 1 from public.products p where p.slug = 'papatya-cayi'
union all select p.id, upper(p.slug) || '-100G', '100g', 7000, 50, 2 from public.products p where p.slug = 'papatya-cayi'

union all select p.id, upper(p.slug) || '-50G', '50g', 4500, 38, 1 from public.products p where p.slug = 'ihlamur'
union all select p.id, upper(p.slug) || '-100G', '100g', 8000, 38, 2 from public.products p where p.slug = 'ihlamur'

union all select p.id, upper(p.slug) || '-50G', '50g', 3800, 28, 1 from public.products p where p.slug = 'biberiye-cayi'
union all select p.id, upper(p.slug) || '-100G', '100g', 6500, 28, 2 from public.products p where p.slug = 'biberiye-cayi'
on conflict (sku) do nothing;

-- Not: Demo admin kullanıcısı oluşturmak için önce Supabase Auth üzerinden
-- (dashboard veya `supabase auth admin`) bir kullanıcı kaydedin, ardından:
--   update public.profiles set role = 'admin' where id = '<kullanicinin-uuid-si>';
