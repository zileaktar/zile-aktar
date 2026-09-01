-- ================================================================
-- KATALOG YENİDEN KURULUMU — mağaza sahibinin güncel stok tablosuna göre.
-- Kaynak: stok-tablosu-2026-08-30.csv (5 kategori, 198 ürün).
--
-- Bu dosyada OLMAYAN tüm mevcut ürünler PASİFE alınır (silinmez — sipariş
-- geçmişi FK'leri korunur). Bu dosyada olan ürünler: adı/kategorisi/fiyatı
-- güncellenir, is_active=true yapılır. AÇIKLAMA (description) alanına DOKUNULMAZ —
-- daha önce yazılmış zengin açıklamalar (migration 0009) korunur.
--
-- categories.is_active sütunu eklenir; yalnızca bu 5 kategori aktif olur,
-- diğerleri (yoresel, macun, tohumlar, ari-urunleri, kuruyemis, tutsu) pasif.
-- ================================================================

-- ---- Kategori aktiflik bayrağı ----
alter table public.categories add column if not exists is_active boolean not null default true;
update public.categories set is_active = false;

insert into public.categories (slug, name, sort_order, is_active) values ('yag', 'Doğal ve Bitkisel Yağlar', 1, true)
  on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;
insert into public.categories (slug, name, sort_order, is_active) values ('baharat', 'Baharatlar', 2, true)
  on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;
insert into public.categories (slug, name, sort_order, is_active) values ('cay', 'Şifalı Bitkiler', 3, true)
  on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;
insert into public.categories (slug, name, sort_order, is_active) values ('kozmetik', 'Sabun Çeşitleri', 4, true)
  on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;
insert into public.categories (slug, name, sort_order, is_active) values ('sirke', 'Sirkeler', 5, true)
  on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;

-- ---- Tüm ürünleri pasife al (aşağıda CSV'dekiler yeniden aktifleşecek) ----
update public.products set is_active = false;

-- ---- CSV ürünleri: ekle / güncelle (description'a dokunma) ----
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'biberiye-yagi', 'Biberiye Yağı', '/urunler/biberiye-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'hint-yagi', 'Hint Yağı', '/urunler/hint-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'tatli-badem-yagi', 'Tatlı Badem Yağı', '/urunler/tatli-badem-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'argan-yagi', 'Argan Yağı', '/urunler/argan-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'corek-otu-yagi', 'Çörek Otu Yağı', '/urunler/corek-otu-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'kabak-cekirdegi-yagi', 'Kabak Çekirdeği Yağı', '/urunler/kabak-cekirdegi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'cam-terebentin-yagi', 'Çam Terebentin Yağı', '/urunler/cam-terebentin-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sari-kantaron-yagi', 'Sarı Kantaron Yağı', '/urunler/sari-kantaron-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'cay-agaci-yagi', 'Çay Ağacı Yağı', '/urunler/cay-agaci-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'hindistan-cevizi-yagi', 'Hindistan Cevizi Yağı', '/urunler/hindistan-cevizi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'zeytin-yagi', 'Zeytin Yağı', '/urunler/zeytin-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'gul-yagi', 'Gül Yağı', '/urunler/gul-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'aci-badem-yagi', 'Acı Badem Yağı', '/urunler/aci-badem-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'kakao-yagi', 'Kakao Yağı', '/urunler/kakao-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'keten-yagi', 'Keten Yağı', '/urunler/keten-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'bamya-tohumu-yagi', 'Bamya Tohumu Yağı', '/urunler/bamya-tohumu-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'hardal-yagi', 'Hardal Yağı', '/urunler/hardal-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'portakal-yagi', 'Portakal Yağı', '/urunler/portakal-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'ceviz-yagi', 'Ceviz Yağı', '/urunler/ceviz-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'aspir-yagi', 'Aspir Yağı', '/urunler/aspir-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'susam-yagi', 'Susam Yağı', '/urunler/susam-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'lavanta-yagi', 'Lavanta Yağı', '/urunler/lavanta-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'kayisi-cekirdegi-yagi', 'Kayısı Çekirdeği Yağı', '/urunler/kayisi-cekirdegi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'kekik-yagi', 'Kekik Yağı', '/urunler/kekik-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'rezene-yagi', 'Rezene Yağı', '/urunler/rezene-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'limon-yagi', 'Limon Yağı', '/urunler/limon-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'aynisefa-yagi', 'Aynısefa Yağı', '/urunler/aynisefa-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'jojoba-yagi', 'Jojoba Yağı', '/urunler/jojoba-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sarimsak-yagi', 'Sarımsak Yağı', '/urunler/sarimsak-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'karanfil-yagi', 'Karanfil Yağı', '/urunler/karanfil-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'yasemin-yagi', 'Yasemin Yağı', '/urunler/yasemin-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'cin-yagi', 'Çin Yağı', '/urunler/cin-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'alabalik-yagi', 'Alabalık Yağı', '/urunler/alabalik-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sari-sabir-aleovera-yagi', 'Sarı Sabır (aleovera) Yağı', '/urunler/sari-sabir-aleovera-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'uzum-cekirdegi-yagi', 'Üzüm Çekirdeği Yağı', '/urunler/uzum-cekirdegi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'avokado-yagi', 'Avokado Yağı', '/urunler/avokado-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'nar-cekirdegi-yagi', 'Nar Çekirdeği Yağı', '/urunler/nar-cekirdegi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'niaouli-yagi', 'Niaouli Yağı', '/urunler/niaouli-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'incir-cekirdegi-yagi', 'İncir Çekirdeği Yağı', '/urunler/incir-cekirdegi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'nane-yagi', 'Nane Yağı', '/urunler/nane-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'at-kestanesi-yagi', 'At Kestanesi Yağı', '/urunler/at-kestanesi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'bugday-yagi', 'Buğday Yağı', '/urunler/bugday-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'hashas-yagi', 'Haşhaş Yağı', '/urunler/hashas-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'helichrysum-olmez-cicek-yagi', 'Helichrysum (ölmez Çiçek) Yağı', '/urunler/helichrysum-olmez-cicek-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'ardic-yagi', 'Ardıç Yağı', '/urunler/ardic-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'okaliptus-yagi', 'Okaliptus Yağı', '/urunler/okaliptus-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'havuc-yagi', 'Havuç Yağı', '/urunler/havuc-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'vanilya-yagi', 'Vanilya Yağı', '/urunler/vanilya-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'gliserin-yagi', 'Gliserin Yağı', '/urunler/gliserin-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'tatli-pulbiber', 'Tatlı Pulbiber', '/urunler/tatli-pulbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'orta-aci-pulbiber', 'Orta Acı Pulbiber', '/urunler/orta-aci-pulbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'zehir-aci-pulbiber', 'Zehir Acı Pulbiber', '/urunler/zehir-aci-pulbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'zehir-zemberek-aci-pulbiber', 'Zehir Zemberek Acı Pulbiber', '/urunler/zehir-zemberek-aci-pulbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'aci-tozbiber', 'Acı Tozbiber', '/urunler/aci-tozbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'tatli-tozbiber', 'Tatlı Tozbiber', '/urunler/tatli-tozbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'orta-aci-tozbiber', 'Orta Acı Tozbiber', '/urunler/orta-aci-tozbiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'isot', 'İsot', '/urunler/isot.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'sumak', 'Sumak', '/urunler/sumak.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'zerdecal', 'Zerdeçal', '/urunler/zerdecal.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'karabiber', 'Karabiber', '/urunler/karabiber.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'yenibahar', 'Yenibahar', '/urunler/yenibahar.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'cigkofte-baharati', 'Çiğköfte Baharatı', '/urunler/cigkofte-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kimyon', 'Kimyon', '/urunler/kimyon.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'zencefil', 'Zencefil', '/urunler/zencefil.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'karanfil', 'Karanfil', '/urunler/karanfil.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'toz-tarcin', 'Toz Tarçın', '/urunler/toz-tarcin.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kakao', 'Kakao', '/urunler/kakao.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'sahlep', 'Sahlep', '/urunler/sahlep.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kofte-baharati', 'Köfte Baharatı', '/urunler/kofte-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'sucuk-baharati', 'Sucuk Baharatı', '/urunler/sucuk-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'yedibahar', 'Yedibahar', '/urunler/yedibahar.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'karbonat', 'Karbonat', '/urunler/karbonat.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'harnup-toz', 'Harnup Toz', '/urunler/harnup-toz.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kori-toz', 'Köri Toz', '/urunler/kori-toz.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'mahlep', 'Mahlep', '/urunler/mahlep.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'sogan-tozu', 'Soğan Tozu', '/urunler/sogan-tozu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'sarimsak-tozu', 'Sarımsak Tozu', '/urunler/sarimsak-tozu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kombe-baharati', 'Kömbe Baharatı', '/urunler/kombe-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'tavuk-baharati', 'Tavuk Baharatı', '/urunler/tavuk-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'toz-karanfil', 'Toz Karanfil', '/urunler/toz-karanfil.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kabartma-tozu', 'Kabartma Tozu', '/urunler/kabartma-tozu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kajun', 'Kajun', '/urunler/kajun.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'havlican-tozu', 'Havlican Tozu', '/urunler/havlican-tozu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'osmanli-baharati', 'Osmanlı Baharatı', '/urunler/osmanli-baharati.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kisnis-tozu', 'Kişniş Tozu', '/urunler/kisnis-tozu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'nane', 'Nane', '/urunler/nane.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'baharat'), 'kekik', 'Kekik', '/urunler/kekik.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'ylang-ylang-yagi', 'Ylang Ylang Yağı', '/urunler/ylang-ylang-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'ada-cayi-yagi', 'Ada Çayı Yağı', '/urunler/ada-cayi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'ozon-yagi', 'Ozon Yağı', '/urunler/ozon-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'zencefil-yagi', 'Zencefil Yağı', '/urunler/zencefil-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'isirgan-tohumu-yagi', 'Isırgan Tohumu Yağı', '/urunler/isirgan-tohumu-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'papatya-yagi', 'Papatya Yağı', '/urunler/papatya-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'anason-yagi', 'Anason Yağı', '/urunler/anason-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'defne-yagi', 'Defne Yağı', '/urunler/defne-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'melisa-yagi', 'Melisa Yağı', '/urunler/melisa-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'karabas-otu-yagi', 'Karabaş Otu Yağı', '/urunler/karabas-otu-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sandal-agaci-yagi', 'Sandal Ağacı Yağı', '/urunler/sandal-agaci-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sedir-agaci-yagi', 'Sedir Ağacı Yağı', '/urunler/sedir-agaci-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'tesbih-agaci-yagi', 'Tesbih Ağacı Yağı', '/urunler/tesbih-agaci-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'bergamut-yagi', 'Bergamut Yağı', '/urunler/bergamut-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'mur-yagi', 'Mür Yağı', '/urunler/mur-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'cilek-yagi', 'Çilek Yağı', '/urunler/cilek-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'hodan-yagi', 'Hodan Yağı', '/urunler/hodan-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'kenevir-yagi', 'Kenevir Yağı', '/urunler/kenevir-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'sigla-agaci-yagi', 'Sığla Ağacı Yağı', '/urunler/sigla-agaci-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'karinca-yumurtasi-yagi', 'Karınca Yumurtası Yağı', '/urunler/karinca-yumurtasi-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'yag'), 'yilan-yagi', 'Yılan Yağı', '/urunler/yilan-yagi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'gul-sabunu', 'Gül Sabunu', '/urunler/gul-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'argan-yagli-sabun', 'Argan Yağlı Sabun', '/urunler/argan-yagli-sabun.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'lavanta-sabun', 'Lavanta Sabun', '/urunler/lavanta-sabun.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'kukurt-sabunu', 'Kükürt Sabunu', '/urunler/kukurt-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'cay-agaci-sabunu', 'Çay Ağacı Sabunu', '/urunler/cay-agaci-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'keci-sutlu-kojik-sabunu', 'Keçi Sütlü Kojik Sabunu', '/urunler/keci-sutlu-kojik-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'pirinc-sutlu-kojik-sabunu', 'Pirinç Sütlü Kojik Sabunu', '/urunler/pirinc-sutlu-kojik-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'leke-karsiti-kojik-sabunu', 'Leke Karşıtı Kojik Sabunu', '/urunler/leke-karsiti-kojik-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'biberiyeli-kojik-sabun', 'Biberiyeli Kojik Sabun', '/urunler/biberiyeli-kojik-sabun.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'yaslanma-karsiti-kojik-sabunu', 'Yaşlanma Karşıtı Kojik Sabunu', '/urunler/yaslanma-karsiti-kojik-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'anti-akne-kojik-sabunu', 'Anti-akne Kojik Sabunu', '/urunler/anti-akne-kojik-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'defne-sabunu', 'Defne Sabunu', '/urunler/defne-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'zeytinyagli-sabun', 'Zeytinyağlı Sabun', '/urunler/zeytinyagli-sabun.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'bittim-sabunu', 'Bıttım Sabunu', '/urunler/bittim-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'sedir-sabunu', 'Sedir Sabunu', '/urunler/sedir-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'ardic-katrani-sabunu', 'Ardıç Katranı Sabunu', '/urunler/ardic-katrani-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'avokado-sabunu', 'Avokado Sabunu', '/urunler/avokado-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'kokusuz-ihram-sabunu', 'Kokusuz İhram Sabunu', '/urunler/kokusuz-ihram-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'ardic-katranli-ve-kukurt-sabunu', 'Ardıç Katranlı Ve Kükürt Sabunu', '/urunler/ardic-katranli-ve-kukurt-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'kozmetik'), 'kojik-asit-sabunu', 'Kojik Asit Sabunu', '/urunler/kojik-asit-sabunu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yarpuz-otu', 'Yarpuz Otu', '/urunler/yarpuz-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'okaliptus-otu', 'Okaliptus Otu', '/urunler/okaliptus-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'bogurtlen-yapragi', 'Böğürtlen Yaprağı', '/urunler/bogurtlen-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'aynisefa-otu', 'Aynısefa Otu', '/urunler/aynisefa-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'hatmi-cicegi', 'Hatmi Çiçeği', '/urunler/hatmi-cicegi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yesil-yulaf', 'Yeşil Yulaf', '/urunler/yesil-yulaf.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'kirkkilit-otu', 'Kırkkilit Otu', '/urunler/kirkkilit-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'avokado-yapragi', 'Avokado Yaprağı', '/urunler/avokado-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'deve-dikeni-tohumu', 'Deve Dikeni Tohumu', '/urunler/deve-dikeni-tohumu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'hayit-otu', 'Hayıt Otu', '/urunler/hayit-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'sahtere-otu', 'Şahtere Otu', '/urunler/sahtere-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'sinirli-otu', 'Sinirli Otu', '/urunler/sinirli-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ebegumeci-otu', 'Ebegümeci Otu', '/urunler/ebegumeci-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'sari-kantaron', 'Sarı Kantaron', '/urunler/sari-kantaron.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'supurge-tohumu', 'Süpürge Tohumu', '/urunler/supurge-tohumu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'kedi-otu', 'Kedi Otu', '/urunler/kedi-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'kurt-pencesi-otu', 'Kurt Pençesi Otu', '/urunler/kurt-pencesi-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'aslan-pencesi-otu', 'Aslan Pençesi Otu', '/urunler/aslan-pencesi-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'hindiba-otu', 'Hindiba Otu', '/urunler/hindiba-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yogurt-otu', 'Yoğurt Otu', '/urunler/yogurt-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ayva-yapragi', 'Ayva Yaprağı', '/urunler/ayva-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'zeytin-yapragi', 'Zeytin Yaprağı', '/urunler/zeytin-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'papatya', 'Papatya', '/urunler/papatya.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'defne-yapragi', 'Defne Yaprağı', '/urunler/defne-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'serbetci-otu', 'Şerbetçi Otu', '/urunler/serbetci-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'isirgan-yapragi', 'Isırgan Yaprağı', '/urunler/isirgan-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'meyan-koku', 'Meyan Kökü', '/urunler/meyan-koku.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'coban-cokerten-otu', 'Çoban Çökerten Otu', '/urunler/coban-cokerten-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'balli-baba-otu', 'Ballı Baba Otu', '/urunler/balli-baba-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'alic-cicegi', 'Alıç Çiçeği', '/urunler/alic-cicegi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'civanpercemi-otu', 'Civanperçemi Otu', '/urunler/civanpercemi-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'altin-otu', 'Altın Otu', '/urunler/altin-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'cinar-yapragi', 'Çınar Yaprağı', '/urunler/cinar-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'gul-kurusu', 'Gül Kurusu', '/urunler/gul-kurusu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'lavanta-otu', 'Lavanta Otu', '/urunler/lavanta-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'kiraz-sapi', 'Kiraz Sapı', '/urunler/kiraz-sapi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ada-cayi', 'Ada Çayı', '/urunler/ada-cayi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'coban-cantasi', 'Çoban Çantası', '/urunler/coban-cantasi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'melisa-limon-kokulu-ot', 'Melisa Limon Kokulu Ot', '/urunler/melisa-limon-kokulu-ot.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'karabas-otu', 'Karabaş Otu', '/urunler/karabas-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'misir-puskulu', 'Mısır Püskülü', '/urunler/misir-puskulu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yaki-otu', 'Yakı Otu', '/urunler/yaki-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yapiskan-andiz-otu', 'Yapışkan Andız Otu', '/urunler/yapiskan-andiz-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'aclik-otu', 'Açlık Otu', '/urunler/aclik-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'enginar-yapragi', 'Enginar Yaprağı', '/urunler/enginar-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ogul-otu', 'Oğul Otu', '/urunler/ogul-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'bogurtlen-koku', 'Böğürtlen Kökü', '/urunler/bogurtlen-koku.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'yasemin-otu', 'Yasemin Otu', '/urunler/yasemin-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'funda-yapragi', 'Funda Yaprağı', '/urunler/funda-yapragi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'mercan-kosk-otu', 'Mercan Köşk Otu', '/urunler/mercan-kosk-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'okse-otu', 'Ökse Otu', '/urunler/okse-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'dul-avrat-otu', 'Dul Avrat Otu', '/urunler/dul-avrat-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'melek-otu', 'Melek Otu', '/urunler/melek-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'uzerlik-otu', 'Üzerlik Otu', '/urunler/uzerlik-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'feslegen-otu', 'Fesleğen Otu', '/urunler/feslegen-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'biberiye-otu', 'Biberiye Otu', '/urunler/biberiye-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'sinameki-otu', 'Sinameki Otu', '/urunler/sinameki-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'hibiskus-otu', 'Hibiskus Otu', '/urunler/hibiskus-otu.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ihlamur', 'Ihlamur', '/urunler/ihlamur.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'cay'), 'ahududu-koku', 'Ahududu Kökü', '/urunler/ahududu-koku.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'alic-sirkesi', 'Alıç Sirkesi', '/urunler/alic-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'isgin-koku-sirkesi', 'Işgın Kökü Sirkesi', '/urunler/isgin-koku-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'detoks-sirkesi-kayisili', 'Detoks Sirkesi (kayısılı)', '/urunler/detoks-sirkesi-kayisili.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'ananas-sirkesi', 'Ananas Sirkesi', '/urunler/ananas-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'enginarli-elma-sirkesi', 'Enginarlı Elma Sirkesi', '/urunler/enginarli-elma-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'enginar-sirkesi', 'Enginar Sirkesi', '/urunler/enginar-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'elma-nar-pancar-sirkesi', 'Elma Nar Pancar Sirkesi', '/urunler/elma-nar-pancar-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'fermente-pancar', 'Fermente Pancar', '/urunler/fermente-pancar.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'dort-hirsiz-sirkesi', 'Dört Hırsız Sirkesi', '/urunler/dort-hirsiz-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();
insert into public.products (category_id, slug, name, image_path, is_active) values ((select id from public.categories where slug = 'sirke'), 'sandarak-sakizi-elma-sirkesi', 'Sandarak Sakızı Elma Sirkesi', '/urunler/sandarak-sakizi-elma-sirkesi.svg', true)
  on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, is_active = true, updated_at = now();

-- ---- Varyantlar: her ürüne tek varyant (<SLUG>-STD). Fiyat/stok/etiket CSV'den. ----
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BIBERIYE-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'biberiye-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HINT-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'hint-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TATLI-BADEM-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'tatli-badem-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ARGAN-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'argan-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'COREK-OTU-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'corek-otu-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KABAK-CEKIRDEGI-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'kabak-cekirdegi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CAM-TEREBENTIN-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'cam-terebentin-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SARI-KANTARON-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'sari-kantaron-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CAY-AGACI-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'cay-agaci-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HINDISTAN-CEVIZI-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'hindistan-cevizi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZEYTIN-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'zeytin-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'GUL-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'gul-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ACI-BADEM-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'aci-badem-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KAKAO-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'kakao-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KETEN-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'keten-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BAMYA-TOHUMU-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'bamya-tohumu-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HARDAL-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'hardal-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'PORTAKAL-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'portakal-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CEVIZ-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'ceviz-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ASPIR-YAGI-STD', '250 ml', 45000, 100, 1 from public.products where slug = 'aspir-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SUSAM-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'susam-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'LAVANTA-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'lavanta-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KAYISI-CEKIRDEGI-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'kayisi-cekirdegi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KEKIK-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'kekik-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'REZENE-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'rezene-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'LIMON-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'limon-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AYNISEFA-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'aynisefa-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'JOJOBA-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'jojoba-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SARIMSAK-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'sarimsak-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARANFIL-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'karanfil-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YASEMIN-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'yasemin-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CIN-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'cin-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ALABALIK-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'alabalik-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SARI-SABIR-ALEOVERA-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'sari-sabir-aleovera-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'UZUM-CEKIRDEGI-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'uzum-cekirdegi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AVOKADO-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'avokado-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'NAR-CEKIRDEGI-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'nar-cekirdegi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'NIAOULI-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'niaouli-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'INCIR-CEKIRDEGI-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'incir-cekirdegi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'NANE-YAGI-STD', '20 ml', 15000, 100, 1 from public.products where slug = 'nane-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AT-KESTANESI-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'at-kestanesi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BUGDAY-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'bugday-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HASHAS-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'hashas-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HELICHRYSUM-OLMEZ-CICEK-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'helichrysum-olmez-cicek-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ARDIC-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'ardic-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OKALIPTUS-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'okaliptus-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HAVUC-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'havuc-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'VANILYA-YAGI-STD', '20 ml', 12000, 100, 1 from public.products where slug = 'vanilya-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'GLISERIN-YAGI-STD', '50 ml', 15000, 100, 1 from public.products where slug = 'gliserin-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TATLI-PULBIBER-STD', '1 kg', 35000, 250, 1 from public.products where slug = 'tatli-pulbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ORTA-ACI-PULBIBER-STD', '1 kg', 35000, 250, 1 from public.products where slug = 'orta-aci-pulbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZEHIR-ACI-PULBIBER-STD', '1 kg', 60000, 250, 1 from public.products where slug = 'zehir-aci-pulbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZEHIR-ZEMBEREK-ACI-PULBIBER-STD', '1 kg', 70000, 250, 1 from public.products where slug = 'zehir-zemberek-aci-pulbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ACI-TOZBIBER-STD', '1 kg', 35000, 250, 1 from public.products where slug = 'aci-tozbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TATLI-TOZBIBER-STD', '1 kg', 35000, 250, 1 from public.products where slug = 'tatli-tozbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ORTA-ACI-TOZBIBER-STD', '1 kg', 35000, 250, 1 from public.products where slug = 'orta-aci-tozbiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ISOT-STD', '1 kg', 40000, 200, 1 from public.products where slug = 'isot'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SUMAK-STD', '1 kg', 50000, 200, 1 from public.products where slug = 'sumak'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZERDECAL-STD', '1 kg', 40000, 100, 1 from public.products where slug = 'zerdecal'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARABIBER-STD', '1 kg', 70000, 200, 1 from public.products where slug = 'karabiber'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YENIBAHAR-STD', '1 kg', 100000, 100, 1 from public.products where slug = 'yenibahar'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CIGKOFTE-BAHARATI-STD', '1 kg', 30000, 100, 1 from public.products where slug = 'cigkofte-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KIMYON-STD', '1 kg', 50000, 100, 1 from public.products where slug = 'kimyon'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZENCEFIL-STD', '1 kg', 50000, 100, 1 from public.products where slug = 'zencefil'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARANFIL-STD', '1 kg', 140000, 50, 1 from public.products where slug = 'karanfil'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TOZ-TARCIN-STD', '1 kg', 60000, 50, 1 from public.products where slug = 'toz-tarcin'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KAKAO-STD', '1 kg', 80000, 50, 1 from public.products where slug = 'kakao'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SAHLEP-STD', '1 kg', 150000, 50, 1 from public.products where slug = 'sahlep'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KOFTE-BAHARATI-STD', '1 kg', 40000, 150, 1 from public.products where slug = 'kofte-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SUCUK-BAHARATI-STD', '1 kg', 40000, 250, 1 from public.products where slug = 'sucuk-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YEDIBAHAR-STD', '1 kg', 40000, 100, 1 from public.products where slug = 'yedibahar'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARBONAT-STD', '1 kg', 15000, 150, 1 from public.products where slug = 'karbonat'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HARNUP-TOZ-STD', '1 kg', 60000, 100, 1 from public.products where slug = 'harnup-toz'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KORI-TOZ-STD', '1 kg', 40000, 100, 1 from public.products where slug = 'kori-toz'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MAHLEP-STD', '1 kg', 200000, 50, 1 from public.products where slug = 'mahlep'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SOGAN-TOZU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'sogan-tozu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SARIMSAK-TOZU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'sarimsak-tozu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KOMBE-BAHARATI-STD', '1 kg', 40000, 50, 1 from public.products where slug = 'kombe-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TAVUK-BAHARATI-STD', '1 kg', 30000, 100, 1 from public.products where slug = 'tavuk-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TOZ-KARANFIL-STD', '1 kg', 60000, 50, 1 from public.products where slug = 'toz-karanfil'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KABARTMA-TOZU-STD', '1 kg', 15000, 100, 1 from public.products where slug = 'kabartma-tozu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KAJUN-STD', '1 kg', 40000, 100, 1 from public.products where slug = 'kajun'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HAVLICAN-TOZU-STD', '1 kg', 65000, 50, 1 from public.products where slug = 'havlican-tozu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OSMANLI-BAHARATI-STD', '1 kg', 40000, 100, 1 from public.products where slug = 'osmanli-baharati'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KISNIS-TOZU-STD', '1 kg', 40000, 50, 1 from public.products where slug = 'kisnis-tozu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'NANE-STD', '1 kg', 50000, 100, 1 from public.products where slug = 'nane'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KEKIK-STD', '1 kg', 85000, 100, 1 from public.products where slug = 'kekik'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YLANG-YLANG-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'ylang-ylang-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ADA-CAYI-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'ada-cayi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OZON-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'ozon-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZENCEFIL-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'zencefil-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ISIRGAN-TOHUMU-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'isirgan-tohumu-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'PAPATYA-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'papatya-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ANASON-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'anason-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DEFNE-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'defne-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MELISA-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'melisa-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARABAS-OTU-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'karabas-otu-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SANDAL-AGACI-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'sandal-agaci-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SEDIR-AGACI-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'sedir-agaci-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'TESBIH-AGACI-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'tesbih-agaci-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BERGAMUT-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'bergamut-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MUR-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'mur-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CILEK-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'cilek-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HODAN-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'hodan-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KENEVIR-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'kenevir-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SIGLA-AGACI-YAGI-STD', '20 ml', 12000, 50, 1 from public.products where slug = 'sigla-agaci-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARINCA-YUMURTASI-YAGI-STD', '20 ml', 10000, 150, 1 from public.products where slug = 'karinca-yumurtasi-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YILAN-YAGI-STD', '20 ml', 10000, 150, 1 from public.products where slug = 'yilan-yagi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'GUL-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'gul-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ARGAN-YAGLI-SABUN-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'argan-yagli-sabun'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'LAVANTA-SABUN-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'lavanta-sabun'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KUKURT-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'kukurt-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CAY-AGACI-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'cay-agaci-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KECI-SUTLU-KOJIK-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'keci-sutlu-kojik-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'PIRINC-SUTLU-KOJIK-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'pirinc-sutlu-kojik-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'LEKE-KARSITI-KOJIK-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'leke-karsiti-kojik-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BIBERIYELI-KOJIK-SABUN-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'biberiyeli-kojik-sabun'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YASLANMA-KARSITI-KOJIK-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'yaslanma-karsiti-kojik-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ANTI-AKNE-KOJIK-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'anti-akne-kojik-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DEFNE-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'defne-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZEYTINYAGLI-SABUN-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'zeytinyagli-sabun'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BITTIM-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'bittim-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SEDIR-SABUNU-STD', '1 adet', 8000, 50, 1 from public.products where slug = 'sedir-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ARDIC-KATRANI-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'ardic-katrani-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AVOKADO-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'avokado-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KOKUSUZ-IHRAM-SABUNU-STD', '1 adet', 5000, 50, 1 from public.products where slug = 'kokusuz-ihram-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ARDIC-KATRANLI-VE-KUKURT-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'ardic-katranli-ve-kukurt-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KOJIK-ASIT-SABUNU-STD', '1 adet', 15000, 50, 1 from public.products where slug = 'kojik-asit-sabunu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YARPUZ-OTU-STD', '40 g', 5000, 50, 1 from public.products where slug = 'yarpuz-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OKALIPTUS-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'okaliptus-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BOGURTLEN-YAPRAGI-STD', '16 g', 5000, 50, 1 from public.products where slug = 'bogurtlen-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AYNISEFA-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'aynisefa-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HATMI-CICEGI-STD', '26 g', 5000, 50, 1 from public.products where slug = 'hatmi-cicegi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YESIL-YULAF-STD', '50 g', 5000, 50, 1 from public.products where slug = 'yesil-yulaf'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KIRKKILIT-OTU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'kirkkilit-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AVOKADO-YAPRAGI-STD', '25 g', 5000, 50, 1 from public.products where slug = 'avokado-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DEVE-DIKENI-TOHUMU-STD', '80 g', 5000, 50, 1 from public.products where slug = 'deve-dikeni-tohumu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HAYIT-OTU-STD', '70 g', 5000, 50, 1 from public.products where slug = 'hayit-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SAHTERE-OTU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'sahtere-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SINIRLI-OTU-STD', '20 g', 5000, 50, 1 from public.products where slug = 'sinirli-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'EBEGUMECI-OTU-STD', '40 g', 5000, 50, 1 from public.products where slug = 'ebegumeci-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SARI-KANTARON-STD', '30 g', 5000, 50, 1 from public.products where slug = 'sari-kantaron'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SUPURGE-TOHUMU-STD', '70 g', 5000, 50, 1 from public.products where slug = 'supurge-tohumu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KEDI-OTU-STD', '50 g', 5000, 50, 1 from public.products where slug = 'kedi-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KURT-PENCESI-OTU-STD', '26 g', 5000, 50, 1 from public.products where slug = 'kurt-pencesi-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ASLAN-PENCESI-OTU-STD', '20 g', 5000, 50, 1 from public.products where slug = 'aslan-pencesi-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HINDIBA-OTU-STD', '34 g', 5000, 50, 1 from public.products where slug = 'hindiba-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YOGURT-OTU-STD', '20 g', 5000, 50, 1 from public.products where slug = 'yogurt-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AYVA-YAPRAGI-STD', '22 g', 5000, 50, 1 from public.products where slug = 'ayva-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ZEYTIN-YAPRAGI-STD', '50 g', 5000, 50, 1 from public.products where slug = 'zeytin-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'PAPATYA-STD', '40 g', 8000, 50, 1 from public.products where slug = 'papatya'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DEFNE-YAPRAGI-STD', '20 g', 5000, 50, 1 from public.products where slug = 'defne-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SERBETCI-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'serbetci-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ISIRGAN-YAPRAGI-STD', '30 g', 5000, 50, 1 from public.products where slug = 'isirgan-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MEYAN-KOKU-STD', '35 g', 5000, 50, 1 from public.products where slug = 'meyan-koku'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'COBAN-COKERTEN-OTU-STD', '50 g', 5000, 50, 1 from public.products where slug = 'coban-cokerten-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BALLI-BABA-OTU-STD', '20 g', 5000, 50, 1 from public.products where slug = 'balli-baba-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ALIC-CICEGI-STD', '30 g', 5000, 50, 1 from public.products where slug = 'alic-cicegi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CIVANPERCEMI-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'civanpercemi-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ALTIN-OTU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'altin-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'CINAR-YAPRAGI-STD', '20 g', 5000, 50, 1 from public.products where slug = 'cinar-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'GUL-KURUSU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'gul-kurusu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'LAVANTA-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'lavanta-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KIRAZ-SAPI-STD', '34 g', 5000, 50, 1 from public.products where slug = 'kiraz-sapi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ADA-CAYI-STD', '30 g', 5000, 50, 1 from public.products where slug = 'ada-cayi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'COBAN-CANTASI-STD', '20 g', 5000, 50, 1 from public.products where slug = 'coban-cantasi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MELISA-LIMON-KOKULU-OT-STD', '20 g', 8000, 50, 1 from public.products where slug = 'melisa-limon-kokulu-ot'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'KARABAS-OTU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'karabas-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MISIR-PUSKULU-STD', '25 g', 5000, 50, 1 from public.products where slug = 'misir-puskulu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YAKI-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'yaki-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YAPISKAN-ANDIZ-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'yapiskan-andiz-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ACLIK-OTU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'aclik-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ENGINAR-YAPRAGI-STD', '30 g', 5000, 50, 1 from public.products where slug = 'enginar-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OGUL-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'ogul-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BOGURTLEN-KOKU-STD', '100 g', 5000, 50, 1 from public.products where slug = 'bogurtlen-koku'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'YASEMIN-OTU-STD', '20 g', 5000, 50, 1 from public.products where slug = 'yasemin-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'FUNDA-YAPRAGI-STD', '70 g', 5000, 50, 1 from public.products where slug = 'funda-yapragi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MERCAN-KOSK-OTU-STD', '40 g', 5000, 50, 1 from public.products where slug = 'mercan-kosk-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'OKSE-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'okse-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DUL-AVRAT-OTU-STD', '40 g', 5000, 50, 1 from public.products where slug = 'dul-avrat-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'MELEK-OTU-STD', '40 g', 5000, 50, 1 from public.products where slug = 'melek-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'UZERLIK-OTU-STD', '30 g', 5000, 50, 1 from public.products where slug = 'uzerlik-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'FESLEGEN-OTU-STD', '1 kg', 80000, 50, 1 from public.products where slug = 'feslegen-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'BIBERIYE-OTU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'biberiye-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SINAMEKI-OTU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'sinameki-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'HIBISKUS-OTU-STD', '1 kg', 50000, 50, 1 from public.products where slug = 'hibiskus-otu'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'IHLAMUR-STD', '1 kg', 200000, 50, 1 from public.products where slug = 'ihlamur'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'AHUDUDU-KOKU-STD', '100 g', 5000, 50, 1 from public.products where slug = 'ahududu-koku'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ALIC-SIRKESI-STD', '500 ml', 15000, 50, 1 from public.products where slug = 'alic-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ISGIN-KOKU-SIRKESI-STD', '500 ml', 20000, 50, 1 from public.products where slug = 'isgin-koku-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DETOKS-SIRKESI-KAYISILI-STD', '500 ml', 18000, 50, 1 from public.products where slug = 'detoks-sirkesi-kayisili'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ANANAS-SIRKESI-STD', '500 ml', 18000, 50, 1 from public.products where slug = 'ananas-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ENGINARLI-ELMA-SIRKESI-STD', '500 ml', 25000, 50, 1 from public.products where slug = 'enginarli-elma-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ENGINAR-SIRKESI-STD', '500 ml', 25000, 50, 1 from public.products where slug = 'enginar-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'ELMA-NAR-PANCAR-SIRKESI-STD', '500 ml', 25000, 50, 1 from public.products where slug = 'elma-nar-pancar-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'FERMENTE-PANCAR-STD', '500 ml', 25000, 50, 1 from public.products where slug = 'fermente-pancar'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'DORT-HIRSIZ-SIRKESI-STD', '500 ml', 15000, 50, 1 from public.products where slug = 'dort-hirsiz-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;
insert into public.product_variants (product_id, sku, label, price_cents, stock, sort_order)
  select id, 'SANDARAK-SAKIZI-ELMA-SIRKESI-STD', '500 ml', 15000, 50, 1 from public.products where slug = 'sandarak-sakizi-elma-sirkesi'
  on conflict (sku) do update set label = excluded.label, price_cents = excluded.price_cents, stock = excluded.stock;

-- ---- Aktif ürünlerin fazla/eski varyantlarını temizle (siparişte kullanılmayanlar) ----
delete from public.product_variants pv
where pv.product_id in (select id from public.products where is_active = true)
  and pv.sku <> upper(regexp_replace((select slug from public.products p where p.id = pv.product_id), '[^a-z0-9]', '-', 'g')) || '-STD'
  and not exists (select 1 from public.order_items oi where oi.variant_id = pv.id);

-- ---- Pasif ürünlerin stoğunu sıfırla (güvenlik; zaten mağazada görünmezler) ----
update public.product_variants set stock = 0
where product_id in (select id from public.products where is_active = false);
