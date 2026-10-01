-- ================================================================
-- 0038 — Panelden toplu fiyat/stok güncelleme (Ürünler → Toplu Güncelleme)
--
-- bulk_update_variants(p_rows jsonb): her satır
--   { sku, old_price_cents, old_compare_at_price_cents, old_stock,
--     price_cents, compare_at_price_cents, stock }
-- Bir varyant YALNIZCA değerleri hâlâ önizlemedeki "eski" değerlerle aynıysa
-- güncellenir (iyimser kilit): admin dosyayı indirdikten sonra bir sipariş
-- stoğu düşürdüyse o satır ÜZERİNE YAZILMAZ, `conflicts` listesine girer —
-- satılmış ürünün stoğu yanlışlıkla geri artmaz.
--
-- SECURITY INVOKER: RLS geçerlidir (variants_staff_update → is_staff() + aal2);
-- ayrıca açıkça is_admin() şartı (fiyat değişikliği yalnız admin).
-- Tek fonksiyon çağrısı = tek transaction: bir CHECK ihlali olursa hiçbir
-- satır değişmez (uygulama önizlemede doğruladığı için beklenmez).
-- ================================================================

create or replace function public.bulk_update_variants(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r jsonb;
  n integer;
  v_updated integer := 0;
  v_conflicts text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'bulk_update_variants: yetkisiz' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 5000 then
    raise exception 'bulk_update_variants: geçersiz istek';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    update public.product_variants
       set price_cents = (r ->> 'price_cents')::integer,
           compare_at_price_cents = (r ->> 'compare_at_price_cents')::integer,
           stock = (r ->> 'stock')::integer
     where sku = r ->> 'sku'
       and price_cents = (r ->> 'old_price_cents')::integer
       and compare_at_price_cents is not distinct from (r ->> 'old_compare_at_price_cents')::integer
       and stock = (r ->> 'old_stock')::integer;
    get diagnostics n = row_count;
    if n = 1 then
      v_updated := v_updated + 1;
    else
      v_conflicts := array_append(v_conflicts, r ->> 'sku');
    end if;
  end loop;

  return jsonb_build_object('updated', v_updated, 'conflicts', to_jsonb(v_conflicts));
end;
$$;

revoke all on function public.bulk_update_variants(jsonb) from public, anon;
grant execute on function public.bulk_update_variants(jsonb) to authenticated;
