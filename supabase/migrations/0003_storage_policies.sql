-- ================================================================
-- SUPABASE STORAGE — "product-images" bucket ve erişim politikaları
-- Görsel yüklemeleri sunucu üzerinden GEÇMEZ: istemci, /api/upload/presigned-url
-- uç noktasından kısa ömürlü (120sn) imzalı bir URL alır ve dosyayı DOĞRUDAN
-- Storage'a yükler. Bu politika, o imzalı URL olmadan kimin ne yapabileceğini tanımlar.
-- ================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Herkes (anon dahil) ürün görsellerini okuyabilir (public bucket).
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Sadece staff (admin/moderator) doğrudan (imzasız) yükleme/silme yapabilir;
-- imzalı presigned URL akışı bu politikadan bağımsız olarak service_role ile çalışır.
create policy "product_images_staff_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_staff());

create policy "product_images_staff_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_staff());

create policy "product_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
