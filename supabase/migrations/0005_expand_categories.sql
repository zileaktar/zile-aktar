-- ================================================================
-- KATEGORİ GENİŞLETMESİ — kullanıcının verdiği geniş ürün listesine
-- (Baharatlar, Şifalı Bitkiler, Yağlar, Tohumlar, Arı Ürünleri, Macunlar,
-- Kozmetik, Kuruyemiş/Süper Gıdalar, Tütsüler, Yöresel) uyacak şekilde.
-- Mevcut 5 kategori YENİDEN ADLANDIRILIYOR (id/slug korunuyor, mevcut 19
-- ürünle bağlantı bozulmuyor), 5 yeni kategori EKLENİYOR.
-- ================================================================

update public.categories set name = 'Baharatlar ve Tatlandırıcılar' where slug = 'baharat';
update public.categories set name = 'Macunlar ve Karışımlar' where slug = 'macun';
update public.categories set name = 'Bitkisel ve Doğal Yağlar' where slug = 'yag';
update public.categories set name = 'Şifalı Bitkiler ve Kurutulmuş Otlar' where slug = 'cay';
-- 'yoresel' adı aynı kalıyor — artık genel yöresel ürünler + Tokat yöresel ürünleri kapsıyor.

insert into public.categories (slug, name, sort_order) values
  ('tohumlar', 'Tohumlar, Çekirdekler ve Bakliyatlar', 6),
  ('ari-urunleri', 'Arı Ürünleri ve Doğal Tatlandırıcılar', 7),
  ('kozmetik', 'Doğal Kozmetik ve Kişisel Bakım', 8),
  ('kuruyemis', 'Kuruyemiş, Kuru Meyve ve Süper Gıdalar', 9),
  ('tutsu', 'Tütsüler, Doğal Taşlar ve Reçineler', 10)
on conflict (slug) do nothing;
