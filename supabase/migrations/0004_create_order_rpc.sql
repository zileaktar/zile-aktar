-- ================================================================
-- ATOMİK SİPARİŞ OLUŞTURMA — create_order(...)
-- Neden bir Postgres fonksiyonu (RPC)? PostgREST/Supabase JS istemcisi çoklu
-- tabloya yazan çok adımlı işlemleri tek bir HTTP isteğinde ATOMİK yapamaz.
-- Bu fonksiyon, aynı ürün varyantına yapılan eşzamanlı sipariş isteklerinde
-- stoğun negatife düşmesini `FOR UPDATE` satır kilidiyle engeller ve
-- fiyat/toplam hesaplamasını TAMAMEN sunucu (veritabanı) tarafında yapar —
-- istemciden gelen hiçbir fiyat/toplam alanına güvenilmez.
--
-- ÖNEMLİ: Kargo eşiği (15000 kuruş) ve ücreti (3990 kuruş) burada
-- src/lib/pricing.ts ile MANUEL senkron tutulmalıdır. Bu değerler sık
-- değişecekse bir `public.settings` tablosuna taşınıp buradan okunmalıdır.
-- ================================================================

create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_contact_email text,
  p_contact_phone text,
  p_payment_provider text,
  p_user_id uuid
)
returns table (order_id uuid, order_number text, subtotal_cents integer, shipping_cents integer, total_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_total integer := 0;
  v_item record;
  v_variant record;
  v_free_shipping_threshold constant integer := 15000;
  v_standard_shipping constant integer := 3990;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- 1. GEÇİŞ: Her satırı kilitle (FOR UPDATE) ve stok yeterliliğini doğrula.
  for v_item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception 'INVALID_QUANTITY: %', v_item.variant_id;
    end if;

    select id, price_cents, stock, label into v_variant
    from public.product_variants
    where id = v_item.variant_id
    for update;

    if not found then
      raise exception 'VARIANT_NOT_FOUND: %', v_item.variant_id;
    end if;

    if v_variant.stock < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK: % (stok: %, istenen: %)', v_variant.label, v_variant.stock, v_item.quantity;
    end if;

    v_subtotal := v_subtotal + (v_variant.price_cents * v_item.quantity);
  end loop;

  v_shipping := case when v_subtotal >= v_free_shipping_threshold then 0 else v_standard_shipping end;
  v_total := v_subtotal + v_shipping;
  v_order_number := 'KA-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 1000000)::text, 6, '0');

  insert into public.orders (
    order_number, user_id, status, subtotal_cents, shipping_cents, total_cents,
    shipping_address, payment_provider, contact_email, contact_phone
  ) values (
    v_order_number, p_user_id, 'pending', v_subtotal, v_shipping, v_total,
    p_shipping_address, p_payment_provider, p_contact_email, p_contact_phone
  )
  returning id into v_order_id;

  -- 2. GEÇİŞ: order_items satırlarını (anlık görüntü ile) oluştur ve stoğu düş.
  for v_item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  loop
    select pv.id, pv.price_cents, pv.label, pv.product_id, p.name as product_name
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.label, v_variant.price_cents, v_item.quantity
    );

    update public.product_variants set stock = stock - v_item.quantity where id = v_item.variant_id;
  end loop;

  return query select v_order_id, v_order_number, v_subtotal, v_shipping, v_total;
end;
$$;

-- Bu fonksiyon YALNIZCA service_role tarafından (yani /api/checkout route handler
-- üzerinden, sunucu tarafı doğrulamalardan geçtikten sonra) çağrılabilir.
-- anon/authenticated rollerinin doğrudan çağırıp fiyat/stok manipülasyonu
-- yapması (ör. sahte adres/negatif miktar) böylece engellenir.
revoke all on function public.create_order from public, anon, authenticated;
grant execute on function public.create_order to service_role;

-- Ödeme sonucu onaylandığında (iyzico webhook/callback) sipariş durumunu günceller.
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_ref text)
returns void
language sql
security definer set search_path = public
as $$
  update public.orders
  set status = 'paid', payment_ref = p_payment_ref
  where id = p_order_id and status = 'pending';
$$;

revoke all on function public.mark_order_paid from public, anon, authenticated;
grant execute on function public.mark_order_paid to service_role;

-- Ödeme başarısız olursa stoğu iade eder (rezerve edilen stok geri açılır).
create or replace function public.mark_order_failed(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_item record;
begin
  update public.orders set status = 'failed' where id = p_order_id and status = 'pending';

  for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
  end loop;
end;
$$;

revoke all on function public.mark_order_failed from public, anon, authenticated;
grant execute on function public.mark_order_failed to service_role;
