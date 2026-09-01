-- ================================================================
-- TOPLU ÜRÜN EKLEME — kullanıcının verdiği 93 satırlık CSV listesinden.
-- 4 ürün (çörek otu, karakovan balı, tatlı badem yağı, ihlamur) mevcut demo
-- ürünleriyle aynı isme sahip olduğundan (aynı slug), `on conflict do nothing`
-- ile OTOMATİK ATLANIR — mevcut ürünler bozulmaz, çift kayıt oluşmaz.
-- Görseller geçici SVG placeholder'lardır (public/urunler/<slug>.svg) —
-- gerçek fotoğraflar hazır olunca aynı dosya adının üzerine yazılması yeterli.
-- ================================================================

-- ---- Baharatlar ve Tatlandırıcılar ----
with cat as (select id from public.categories where slug = 'baharat')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('karabiber', 'Karabiber', 'Tane veya öğütülmüş, keskin aromalı temel baharat', '/urunler/karabiber.svg', array['100% Doğal']),
  ('pul-biber', 'Pul Biber', 'Acı veya tatlı seçenekli, ipek pul biber', '/urunler/pul-biber.svg', array['Yöresel','100% Doğal']),
  ('kimyon', 'Kimyon', 'Sindirimi kolaylaştırıcı, yoğun aromalı toz baharat', '/urunler/kimyon.svg', array['100% Doğal']),
  ('kekik', 'Kekik', 'Dağ kekiği, dağ kokulu ve antioksidan zengini', '/urunler/kekik.svg', array['Yöresel','100% Doğal']),
  ('nane', 'Nane', 'Kurutulmuş ferahlatıcı yaprak nane', '/urunler/nane.svg', array['100% Doğal']),
  ('tarcin', 'Tarçın', 'Çubuk ve toz Seylan/Seylon tarçını', '/urunler/tarcin.svg', array['100% Doğal']),
  ('karanfil', 'Karanfil', 'Tane karanfil, ağız kokusu ve çaylarda kullanılır', '/urunler/karanfil.svg', array['100% Doğal']),
  ('zencefil', 'Zencefil', 'Taze kök ve toz, bağışıklık destekleyici', '/urunler/zencefil.svg', array['100% Doğal']),
  ('zerdecal', 'Zerdeçal', 'Toz kurkumin kaynağı, doğal renklendirici', '/urunler/zerdecal.svg', array['100% Doğal']),
  ('sumak', 'Sumak', 'Ekşi aromalı, tane ve öğütülmüş sumak', '/urunler/sumak.svg', array['Yöresel','100% Doğal']),
  ('yenibahar', 'Yenibahar', 'Çoklu aroma profiline sahip özel baharat', '/urunler/yenibahar.svg', array['100% Doğal']),
  ('susam', 'Susam', 'Çifte kavrulmuş veya çiğ beyaz susam', '/urunler/susam.svg', array['100% Doğal']),
  ('kisnis', 'Kişniş', 'Tane ve toz, ferahlatıcı hafif narenciye notalı', '/urunler/kisnis.svg', array['100% Doğal']),
  ('biberiye', 'Biberiye', 'Kurutulmuş biberiye yaprakları', '/urunler/biberiye.svg', array['100% Doğal']),
  ('kori', 'Köri', 'Özel harman hint baharat karışımı', '/urunler/kori.svg', array['Geleneksel']),
  ('safran', 'Safran', 'Yerli / İran saf safran lifleri', '/urunler/safran.svg', array['Sınırlı Stok','Yöresel']),
  ('isot', 'İsot', 'Şanlıurfa ev yapımı mor/siyah isot', '/urunler/isot.svg', array['Yöresel','Geleneksel']),
  ('feslegen', 'Fesleğen', 'Kurutulmuş fesleğen yaprağı', '/urunler/feslegen.svg', array['100% Doğal']),
  ('mahlep', 'Mahlep', 'Hamur işlerine özel kokulu mahlep çekirdeği/tozu', '/urunler/mahlep.svg', array['100% Doğal']),
  ('havlican', 'Havlıcan', 'Kök ve toz formda ısıtıcı baharat', '/urunler/havlican.svg', array['100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Şifalı Bitkiler ve Kurutulmuş Otlar ----
with cat as (select id from public.categories where slug = 'cay')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('meyan-koku', 'Meyan Kökü', 'Şerbet ve çay yapımına uygun doğal meyan kökü', '/urunler/meyan-koku.svg', array['100% Doğal']),
  ('papatya', 'Papatya', 'Sakinleştirici kurutulmuş mayıs papatyası', '/urunler/papatya.svg', array['100% Doğal']),
  ('adacayi', 'Adaçayı', 'Demet veya yaprak adaçayı, boğaz rahatlatıcı', '/urunler/adacayi.svg', array['Yöresel','100% Doğal']),
  ('yesil-cay', 'Yeşil Çay', 'Dökme antioksidan deposu yeşil çay', '/urunler/yesil-cay.svg', array['100% Doğal']),
  ('melisa', 'Melisa', 'Oğul otu, rahatlatıcı limon kokulu melisa', '/urunler/melisa.svg', array['100% Doğal']),
  ('kusburnu', 'Kuşburnu', 'Tane C vitamini zengini kurutulmuş kuşburnu', '/urunler/kusburnu.svg', array['100% Doğal']),
  ('sinameki', 'Sinameki', 'Sindirimi hızlandırıcı bitki yaprağı', '/urunler/sinameki.svg', array['100% Doğal']),
  ('sari-kantaron', 'Sarı Kantaron', 'Kurutulmuş sarı kantaron otu', '/urunler/sari-kantaron.svg', array['100% Doğal']),
  ('rezene', 'Rezene', 'Tane rezene tohumu, gaz giderici ve rahatlatıcı', '/urunler/rezene.svg', array['100% Doğal']),
  ('isirgan-otu', 'Isırgan Otu', 'Kurutulmuş ısırgan yaprağı', '/urunler/isirgan-otu.svg', array['100% Doğal']),
  ('anason', 'Anason', 'Aromatik anason tohumu', '/urunler/anason.svg', array['100% Doğal']),
  ('funda-yapragi', 'Funda Yaprağı', 'Ödem atmaya yardımcı kurutulmuş funda otu', '/urunler/funda-yapragi.svg', array['100% Doğal']),
  ('mate-cayi', 'Mate Çayı', 'Enerji verici Güney Amerika mate yaprakları', '/urunler/mate-cayi.svg', array['100% Doğal']),
  ('civanpercemi', 'Civanperçemi', 'Geleneksel kadın sağlığı destek otu', '/urunler/civanpercemi.svg', array['Geleneksel']),
  ('hibiskus', 'Hibiskus', 'Mekke gülü, nar çiçeği ekşimsi çay', '/urunler/hibiskus.svg', array['100% Doğal']),
  ('hatmi-cicegi', 'Hatmi Çiçeği', 'Boğaz ve öksürük yumuşatıcı mor/beyaz hatmi', '/urunler/hatmi-cicegi.svg', array['100% Doğal']),
  ('okaliptus-yapragi', 'Okaliptüs Yaprağı', 'Nefes açıcı kurutulmuş okaliptüs', '/urunler/okaliptus-yapragi.svg', array['100% Doğal']),
  ('lavanta', 'Lavanta', 'Fransız/Isparta kurutulmuş lavanta çiçeği', '/urunler/lavanta.svg', array['Yöresel','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Bitkisel ve Doğal Yağlar ----
with cat as (select id from public.categories where slug = 'yag')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('corek-otu-yagi', 'Çörek Otu Yağı', 'Soğuk sıkım %100 saf çörek otu yağı', '/urunler/corek-otu-yagi.svg', array['Soğuk Sıkım','100% Doğal']),
  ('hindistan-cevizi-yagi', 'Hindistan Cevizi Yağı', 'Soğuk sıkım organik hindistan cevizi yağı', '/urunler/hindistan-cevizi-yagi.svg', array['Soğuk Sıkım','100% Doğal']),
  ('argan-yagi', 'Argan Yağı', 'Saf Fas argan yağı, saç ve cilt besleyici', '/urunler/argan-yagi.svg', array['100% Doğal']),
  ('jojoba-yagi', 'Jojoba Yağı', 'Cilt nem dengesini düzenleyen sabit yağ', '/urunler/jojoba-yagi.svg', array['100% Doğal']),
  ('lavanta-yagi', 'Lavanta Yağı', 'Uçucu saf lavanta yağı, aromaterapi', '/urunler/lavanta-yagi.svg', array['100% Doğal']),
  ('nane-yagi', 'Nane Yağı', 'Uçucu ferahlatıcı tıbbi nane yağı', '/urunler/nane-yagi.svg', array['100% Doğal']),
  ('kekik-yagi', 'Kekik Yağı', 'Keskin uçucu dağ kekiği yağı', '/urunler/kekik-yagi.svg', array['Yöresel','100% Doğal']),
  ('cay-agaci-yagi', 'Çay Ağacı Yağı', 'Cilt leke ve sivilce karşıtı uçucu yağ', '/urunler/cay-agaci-yagi.svg', array['100% Doğal']),
  ('hint-yagi', 'Hint Yağı', 'Kirpik, kaş ve saç gürleştirici yağ', '/urunler/hint-yagi.svg', array['100% Doğal']),
  ('sari-kantaron-yagi', 'Sarı Kantaron Yağı', 'Zeytinyağında masere edilmiş kırmızı kantaron yağı', '/urunler/sari-kantaron-yagi.svg', array['Geleneksel','100% Doğal']),
  ('susam-yagi', 'Susam Yağı', 'Soğuk sıkım doğal susam yağı', '/urunler/susam-yagi.svg', array['Soğuk Sıkım','100% Doğal']),
  ('okaliptus-yagi', 'Okaliptüs Yağı', 'Uçucu ferahlatıcı buğu yağı', '/urunler/okaliptus-yagi.svg', array['100% Doğal']),
  ('biberiye-yagi', 'Biberiye Yağı', 'Uçucu saç kökü uyarıcı biberiye yağı', '/urunler/biberiye-yagi.svg', array['100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Macunlar ve Karışımlar ----
with cat as (select id from public.categories where slug = 'macun')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('mesir-macunu', 'Mesir Macunu', '41 çeşit baharatlı Manisa mesir macunu', '/urunler/mesir-macunu.svg', array['Yöresel','Geleneksel']),
  ('cam-kozalagi-macunu', 'Çam Kozalağı Macunu', 'Akciğer ve solunum rahatlatıcı kozalak macunu', '/urunler/cam-kozalagi-macunu.svg', array['Geleneksel','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Arı Ürünleri ve Doğal Tatlandırıcılar ----
with cat as (select id from public.categories where slug = 'ari-urunleri')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('propolis', 'Propolis', 'Suda çözünebilir damla yerli propolis', '/urunler/propolis.svg', array['100% Doğal']),
  ('ari-sutu', 'Arı Sütü', 'Taze ve saf arı sütü', '/urunler/ari-sutu.svg', array['Sınırlı Stok','100% Doğal']),
  ('polen', 'Polen', 'Doğal taze çiçek poleni', '/urunler/polen.svg', array['100% Doğal']),
  ('ham-bal', 'Ham Bal', 'İşlenmemiş, ısıl işlem görmemiş süzme çiçek balı', '/urunler/ham-bal.svg', array['100% Doğal']),
  ('keciboynuzu-ozu', 'Keçiboynuzu Özü', 'Soğuk pres katkısız keçiboynuzu (harnup) özü', '/urunler/keciboynuzu-ozu.svg', array['100% Doğal']),
  ('karadut-ozu', 'Karadut Özü', 'Ağız yaraları ve bağışıklık için koyu karadut özü', '/urunler/karadut-ozu.svg', array['100% Doğal']),
  ('elma-sirkesi', 'Elma Sirkesi', 'Doğal fermente tortulu canlı elma sirkesi', '/urunler/elma-sirkesi.svg', array['100% Doğal']),
  ('enginar-sirkesi', 'Enginar Sirkesi', 'Karaciğer dostu ev yapımı enginar sirkesi', '/urunler/enginar-sirkesi.svg', array['100% Doğal']),
  ('alic-sirkesi', 'Alıç Sirkesi', 'Kalp ve damar sağlığını destekleyen alıç sirkesi', '/urunler/alic-sirkesi.svg', array['100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Tohumlar, Çekirdekler ve Bakliyatlar ----
with cat as (select id from public.categories where slug = 'tohumlar')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('chia-tohumu', 'Chia Tohumu', 'Lif ve Omega-3 deposu chia tohumu', '/urunler/chia-tohumu.svg', array['100% Doğal']),
  ('keten-tohumu', 'Keten Tohumu', 'Tane veya öğütülmüş lifli tohum', '/urunler/keten-tohumu.svg', array['100% Doğal']),
  ('kinoa', 'Kinoa', 'Glutensiz beyaz/kırmızı kinoa', '/urunler/kinoa.svg', array['100% Doğal']),
  ('goji-berry', 'Goji Berry', 'Kurt üzümü, antioksidan kurutulmuş meyve', '/urunler/goji-berry.svg', array['100% Doğal']),
  ('hunnap', 'Hünnap', 'Kurutulmuş yerli hünnap meyvesi', '/urunler/hunnap.svg', array['Yöresel','100% Doğal']),
  ('igde', 'İğde', 'Unlu tatlı doğal iğde meyvesi', '/urunler/igde.svg', array['Yöresel','100% Doğal']),
  ('yaban-mersini', 'Yaban Mersini', 'Kurutulmuş turna yemişi / yaban mersini', '/urunler/yaban-mersini.svg', array['100% Doğal']),
  ('kenevir-tohumu', 'Kenevir Tohumu', 'Soyulmuş/kabuklu yüksek proteinli tohum', '/urunler/kenevir-tohumu.svg', array['100% Doğal']),
  ('keciboynuzu', 'Keçiboynuzu', 'Bütün kuru harnup meyvesi', '/urunler/keciboynuzu.svg', array['Yöresel','100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Doğal Kozmetik ve Kişisel Bakım ----
with cat as (select id from public.categories where slug = 'kozmetik')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('bittim-sabunu', 'Bıttım Sabunu', 'Siirt yöresi kepek ve dökülme karşıtı bıttım sabunu', '/urunler/bittim-sabunu.svg', array['Yöresel','Geleneksel']),
  ('defne-sabunu', 'Defne Sabunu', 'Hatay ev yapımı %100 zeytinyağlı defne sabunu', '/urunler/defne-sabunu.svg', array['Yöresel','Geleneksel']),
  ('keci-sutu-sabunu', 'Keçi Sütü Sabunu', 'Hassas ciltler için nemlendirici keçi sütü sabunu', '/urunler/keci-sutu-sabunu.svg', array['100% Doğal']),
  ('zeytinyagli-sabun', 'Zeytinyağlı Sabun', 'Geleneksel banyo ve pirina sabunu', '/urunler/zeytinyagli-sabun.svg', array['Geleneksel']),
  ('kil-maskesi', 'Kil Maskesi', 'Doğal beyaz/yeşil toz kil maskesi', '/urunler/kil-maskesi.svg', array['100% Doğal']),
  ('gul-suyu', 'Gül Suyu', '%100 saf Isparta distilasyon gül suyu', '/urunler/gul-suyu.svg', array['Yöresel','100% Doğal']),
  ('kina', 'Kına', 'Yeşil Hint kınası veya toz Türk kınası', '/urunler/kina.svg', array['Geleneksel']),
  ('rastik', 'Rastık', 'Geleneksel kaş ve saç koyulaştırıcı taş/toz rastık', '/urunler/rastik.svg', array['Geleneksel'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ---- Tütsüler, Doğal Taşlar ve Reçineler ----
with cat as (select id from public.categories where slug = 'tutsu')
insert into public.products (category_id, slug, name, description, image_path, badges)
select cat.id, v.slug, v.name, v.description, v.image_path, v.badges from cat, (values
  ('akgunluk-recinesi', 'Akgünlük Reçinesi', 'Tütsülük ve çiğnemelik sığla / akgünlük reçinesi', '/urunler/akgunluk-recinesi.svg', array['100% Doğal']),
  ('udi-hindi', 'Udi Hindi', 'Kök ve toz formda öd ağacı / udi hindi', '/urunler/udi-hindi.svg', array['Sınırlı Stok']),
  ('ginseng', 'Ginseng', 'Kırmızı Kore ginseng kökü', '/urunler/ginseng.svg', array['Sınırlı Stok']),
  ('gunluk-sakizi', 'Günlük Sakızı', 'Mide dostu çiğnenebilir doğal günlük reçinesi', '/urunler/gunluk-sakizi.svg', array['100% Doğal']),
  ('damla-sakizi', 'Damla Sakızı', 'Orijinal Sakız Adası damla sakızı', '/urunler/damla-sakizi.svg', array['Yöresel','Sınırlı Stok']),
  ('kaya-tuzu', 'Kaya Tuzu', 'Çankırı katkısız yıkanmış doğal kaya tuzu', '/urunler/kaya-tuzu.svg', array['Yöresel','100% Doğal']),
  ('deniz-tuzu', 'Deniz Tuzu', 'İri taneli doğal deniz tuzu', '/urunler/deniz-tuzu.svg', array['100% Doğal']),
  ('ingiliz-tuzu', 'İngiliz Tuzu', 'Epsom tuzu, magnezyum sülfat kristali', '/urunler/ingiliz-tuzu.svg', array['100% Doğal']),
  ('karbonat', 'Karbonat', 'İngiliz karbonatı / Sodyum bikarbonat', '/urunler/karbonat.svg', array['100% Doğal']),
  ('sap', 'Şap', 'Doğal potasyum şap kristali', '/urunler/sap.svg', array['100% Doğal'])
) as v(slug, name, description, image_path, badges)
on conflict (slug) do nothing;

-- ================================================================
-- VARYANTLAR — CSV'de tek gramaj/fiyat/stok verildiği için her ürüne TEK
-- varyant atanıyor. Birim, ürün tipine göre seçildi (baharat/ot -> 100g,
-- yağ -> 100ml (esansiyel yağlar 20ml), sabun -> 1 adet, tuz/reçine -> 500g/50g).
-- Fiyatlar TL*100 (kuruş) olarak yazıldı.
-- ================================================================
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
select p.id, upper(p.slug) || '-STD', '100g', 12000, 50, 1 from public.products p where p.slug = 'karabiber'
union all select p.id, upper(p.slug) || '-STD', '100g', 14000, 65, 1 from public.products p where p.slug = 'pul-biber'
union all select p.id, upper(p.slug) || '-STD', '100g', 18000, 40, 1 from public.products p where p.slug = 'kimyon'
union all select p.id, upper(p.slug) || '-STD', '100g', 15000, 30, 1 from public.products p where p.slug = 'kekik'
union all select p.id, upper(p.slug) || '-STD', '100g', 11000, 45, 1 from public.products p where p.slug = 'nane'
union all select p.id, upper(p.slug) || '-STD', '100g', 25000, 25, 1 from public.products p where p.slug = 'tarcin'
union all select p.id, upper(p.slug) || '-STD', '100g', 45000, 20, 1 from public.products p where p.slug = 'karanfil'
union all select p.id, upper(p.slug) || '-STD', '100g', 22000, 35, 1 from public.products p where p.slug = 'zencefil'
union all select p.id, upper(p.slug) || '-STD', '100g', 20000, 40, 1 from public.products p where p.slug = 'zerdecal'
union all select p.id, upper(p.slug) || '-STD', '100g', 16000, 50, 1 from public.products p where p.slug = 'sumak'
union all select p.id, upper(p.slug) || '-STD', '100g', 28000, 15, 1 from public.products p where p.slug = 'yenibahar'
union all select p.id, upper(p.slug) || '-STD', '100g', 10000, 55, 1 from public.products p where p.slug = 'susam'
union all select p.id, upper(p.slug) || '-STD', '100g', 14000, 25, 1 from public.products p where p.slug = 'kisnis'
union all select p.id, upper(p.slug) || '-STD', '100g', 13000, 30, 1 from public.products p where p.slug = 'biberiye'
union all select p.id, upper(p.slug) || '-STD', '100g', 16000, 35, 1 from public.products p where p.slug = 'kori'
union all select p.id, upper(p.slug) || '-STD', '5g', 35000, 5, 1 from public.products p where p.slug = 'safran'
union all select p.id, upper(p.slug) || '-STD', '100g', 17000, 40, 1 from public.products p where p.slug = 'isot'
union all select p.id, upper(p.slug) || '-STD', '100g', 14000, 25, 1 from public.products p where p.slug = 'feslegen'
union all select p.id, upper(p.slug) || '-STD', '100g', 38000, 15, 1 from public.products p where p.slug = 'mahlep'
union all select p.id, upper(p.slug) || '-STD', '100g', 24000, 20, 1 from public.products p where p.slug = 'havlican'

union all select p.id, upper(p.slug) || '-STD', '100g', 11000, 30, 1 from public.products p where p.slug = 'meyan-koku'
union all select p.id, upper(p.slug) || '-STD', '100g', 30000, 25, 1 from public.products p where p.slug = 'papatya'
union all select p.id, upper(p.slug) || '-STD', '100g', 20000, 35, 1 from public.products p where p.slug = 'adacayi'
union all select p.id, upper(p.slug) || '-STD', '100g', 22000, 40, 1 from public.products p where p.slug = 'yesil-cay'
union all select p.id, upper(p.slug) || '-STD', '100g', 25000, 20, 1 from public.products p where p.slug = 'melisa'
union all select p.id, upper(p.slug) || '-STD', '100g', 13000, 45, 1 from public.products p where p.slug = 'kusburnu'
union all select p.id, upper(p.slug) || '-STD', '100g', 12000, 30, 1 from public.products p where p.slug = 'sinameki'
union all select p.id, upper(p.slug) || '-STD', '100g', 18000, 25, 1 from public.products p where p.slug = 'sari-kantaron'
union all select p.id, upper(p.slug) || '-STD', '100g', 15000, 35, 1 from public.products p where p.slug = 'rezene'
union all select p.id, upper(p.slug) || '-STD', '100g', 14000, 30, 1 from public.products p where p.slug = 'isirgan-otu'
union all select p.id, upper(p.slug) || '-STD', '100g', 22000, 20, 1 from public.products p where p.slug = 'anason'
union all select p.id, upper(p.slug) || '-STD', '100g', 16000, 25, 1 from public.products p where p.slug = 'funda-yapragi'
union all select p.id, upper(p.slug) || '-STD', '100g', 28000, 20, 1 from public.products p where p.slug = 'mate-cayi'
union all select p.id, upper(p.slug) || '-STD', '100g', 17000, 15, 1 from public.products p where p.slug = 'civanpercemi'
union all select p.id, upper(p.slug) || '-STD', '100g', 21000, 40, 1 from public.products p where p.slug = 'hibiskus'
union all select p.id, upper(p.slug) || '-STD', '100g', 32000, 15, 1 from public.products p where p.slug = 'hatmi-cicegi'
union all select p.id, upper(p.slug) || '-STD', '100g', 15000, 20, 1 from public.products p where p.slug = 'okaliptus-yapragi'
union all select p.id, upper(p.slug) || '-STD', '100g', 26000, 30, 1 from public.products p where p.slug = 'lavanta'

union all select p.id, upper(p.slug) || '-STD', '100ml', 18000, 25, 1 from public.products p where p.slug = 'corek-otu-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 15000, 30, 1 from public.products p where p.slug = 'hindistan-cevizi-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 25000, 15, 1 from public.products p where p.slug = 'argan-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 21000, 12, 1 from public.products p where p.slug = 'jojoba-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 14000, 18, 1 from public.products p where p.slug = 'lavanta-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 9500, 20, 1 from public.products p where p.slug = 'nane-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 11000, 15, 1 from public.products p where p.slug = 'kekik-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 13000, 22, 1 from public.products p where p.slug = 'cay-agaci-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 10000, 25, 1 from public.products p where p.slug = 'hint-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 16000, 30, 1 from public.products p where p.slug = 'sari-kantaron-yagi'
union all select p.id, upper(p.slug) || '-STD', '100ml', 13000, 20, 1 from public.products p where p.slug = 'susam-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 10000, 15, 1 from public.products p where p.slug = 'okaliptus-yagi'
union all select p.id, upper(p.slug) || '-STD', '20ml', 12000, 18, 1 from public.products p where p.slug = 'biberiye-yagi'

union all select p.id, upper(p.slug) || '-STD', '100g', 12000, 40, 1 from public.products p where p.slug = 'mesir-macunu'
union all select p.id, upper(p.slug) || '-STD', '100g', 18000, 35, 1 from public.products p where p.slug = 'cam-kozalagi-macunu'

union all select p.id, upper(p.slug) || '-STD', '30ml', 22000, 25, 1 from public.products p where p.slug = 'propolis'
union all select p.id, upper(p.slug) || '-STD', '30g', 35000, 10, 1 from public.products p where p.slug = 'ari-sutu'
union all select p.id, upper(p.slug) || '-STD', '100g', 16000, 30, 1 from public.products p where p.slug = 'polen'
union all select p.id, upper(p.slug) || '-STD', '500g', 40000, 20, 1 from public.products p where p.slug = 'ham-bal'
union all select p.id, upper(p.slug) || '-STD', '250ml', 14000, 45, 1 from public.products p where p.slug = 'keciboynuzu-ozu'
union all select p.id, upper(p.slug) || '-STD', '250ml', 15000, 40, 1 from public.products p where p.slug = 'karadut-ozu'
union all select p.id, upper(p.slug) || '-STD', '500ml', 8000, 50, 1 from public.products p where p.slug = 'elma-sirkesi'
union all select p.id, upper(p.slug) || '-STD', '500ml', 10000, 30, 1 from public.products p where p.slug = 'enginar-sirkesi'
union all select p.id, upper(p.slug) || '-STD', '500ml', 11000, 35, 1 from public.products p where p.slug = 'alic-sirkesi'

union all select p.id, upper(p.slug) || '-STD', '100g', 16000, 40, 1 from public.products p where p.slug = 'chia-tohumu'
union all select p.id, upper(p.slug) || '-STD', '100g', 9000, 50, 1 from public.products p where p.slug = 'keten-tohumu'
union all select p.id, upper(p.slug) || '-STD', '100g', 18000, 30, 1 from public.products p where p.slug = 'kinoa'
union all select p.id, upper(p.slug) || '-STD', '100g', 32000, 20, 1 from public.products p where p.slug = 'goji-berry'
union all select p.id, upper(p.slug) || '-STD', '100g', 20000, 25, 1 from public.products p where p.slug = 'hunnap'
union all select p.id, upper(p.slug) || '-STD', '100g', 11000, 30, 1 from public.products p where p.slug = 'igde'
union all select p.id, upper(p.slug) || '-STD', '100g', 35000, 25, 1 from public.products p where p.slug = 'yaban-mersini'
union all select p.id, upper(p.slug) || '-STD', '100g', 24000, 15, 1 from public.products p where p.slug = 'kenevir-tohumu'
union all select p.id, upper(p.slug) || '-STD', '100g', 10000, 35, 1 from public.products p where p.slug = 'keciboynuzu'

union all select p.id, upper(p.slug) || '-STD', '1 adet', 4500, 40, 1 from public.products p where p.slug = 'bittim-sabunu'
union all select p.id, upper(p.slug) || '-STD', '1 adet', 4000, 45, 1 from public.products p where p.slug = 'defne-sabunu'
union all select p.id, upper(p.slug) || '-STD', '1 adet', 5000, 35, 1 from public.products p where p.slug = 'keci-sutu-sabunu'
union all select p.id, upper(p.slug) || '-STD', '1 adet', 3000, 60, 1 from public.products p where p.slug = 'zeytinyagli-sabun'
union all select p.id, upper(p.slug) || '-STD', '100g', 7000, 30, 1 from public.products p where p.slug = 'kil-maskesi'
union all select p.id, upper(p.slug) || '-STD', '250ml', 9000, 50, 1 from public.products p where p.slug = 'gul-suyu'
union all select p.id, upper(p.slug) || '-STD', '100g', 12000, 40, 1 from public.products p where p.slug = 'kina'
union all select p.id, upper(p.slug) || '-STD', '50g', 6000, 15, 1 from public.products p where p.slug = 'rastik'

union all select p.id, upper(p.slug) || '-STD', '50g', 38000, 20, 1 from public.products p where p.slug = 'akgunluk-recinesi'
union all select p.id, upper(p.slug) || '-STD', '50g', 45000, 25, 1 from public.products p where p.slug = 'udi-hindi'
union all select p.id, upper(p.slug) || '-STD', '50g', 85000, 10, 1 from public.products p where p.slug = 'ginseng'
union all select p.id, upper(p.slug) || '-STD', '50g', 35000, 20, 1 from public.products p where p.slug = 'gunluk-sakizi'
union all select p.id, upper(p.slug) || '-STD', '50g', 15000, 8, 1 from public.products p where p.slug = 'damla-sakizi'
union all select p.id, upper(p.slug) || '-STD', '500g', 3000, 100, 1 from public.products p where p.slug = 'kaya-tuzu'
union all select p.id, upper(p.slug) || '-STD', '500g', 4000, 80, 1 from public.products p where p.slug = 'deniz-tuzu'
union all select p.id, upper(p.slug) || '-STD', '250g', 9000, 35, 1 from public.products p where p.slug = 'ingiliz-tuzu'
union all select p.id, upper(p.slug) || '-STD', '500g', 5000, 90, 1 from public.products p where p.slug = 'karbonat'
union all select p.id, upper(p.slug) || '-STD', '100g', 7000, 30, 1 from public.products p where p.slug = 'sap'
on conflict (sku) do nothing;
