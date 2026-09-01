-- ================================================================
-- YAYIN ÖNCESİ SERTLEŞTİRME (güvenlik/performans denetimi bulguları)
--
-- H1: mark_order_failed idempotent yapılır — fonksiyon aynı sipariş için
--     iki kez çağrılırsa (ör. iyzico callback FAILURE + aynı olayın asenkron
--     webhook'u, ya da callback + cron) stok İKİNCİ KEZ iade ediliyordu.
--     Sonuç: gerçekte olmayan stok görünür → fazla satış (oversell).
--
-- M2: create_order, is_active = false yapılmış bir ürünün varyantını
--     (UUID'si bilinen) elle hazırlanmış bir istekle sipariş etmeyi engeller.
--
-- M4: orders/order_items üzerinde sık kullanılan ama eksik olan index'ler.
--
-- L6: moderator kendi profilini (telefon vb.) güncelleyemiyordu — eski
--     politika satır sonrası role = 'user' olmasını şart koşuyordu. Yeni
--     politika kullanıcının KENDİ mevcut rolünü korumasını şart koşar,
--     böylece rol yükseltme hâlâ imkânsız ama diğer alanlar güncellenebilir.
-- ================================================================

-- ----------------------------------------------------------------
-- H1 — mark_order_failed idempotency
-- ----------------------------------------------------------------
create or replace function public.mark_order_failed(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
begin
  update public.orders set status = 'failed' where id = p_order_id and status = 'pending';
  get diagnostics v_updated = row_count;

  -- Sipariş zaten "pending" değildiyse (daha önce işlenmiş) stok tekrar iade edilmez.
  if v_updated = 0 then
    return;
  end if;

  for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
  end loop;
end;
$$;

revoke all on function public.mark_order_failed from public, anon, authenticated;
grant execute on function public.mark_order_failed to service_role;

-- ----------------------------------------------------------------
-- M2 — create_order: pasif ürün varyantı sipariş edilemez
-- (0004'teki fonksiyon; yalnızca 1. GEÇİŞ'teki varyant SELECT'i değişti —
--  artık products'a join edip is_active = true şartı koyuyor.)
-- ----------------------------------------------------------------
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

    select pv.id, pv.price_cents, pv.stock, pv.label
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id and p.is_active = true
    for update of pv;

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

revoke all on function public.create_order from public, anon, authenticated;
grant execute on function public.create_order to service_role;

-- ----------------------------------------------------------------
-- M4 — eksik index'ler
-- ----------------------------------------------------------------
-- Cron (status='pending' AND created_at < cutoff) + admin özet sıralaması.
create index if not exists idx_orders_status_created_at on public.orders (status, created_at);
-- "Siparişlerim" sayfası: user_id filtresi + created_at'e göre azalan sıralama.
create index if not exists idx_orders_user_id_created_at on public.orders (user_id, created_at desc);
-- order_items.product_id / variant_id: ikisi de ON DELETE RESTRICT FK — index yoksa
-- bir ürün/varyant silinmeye çalışıldığında order_items tam taranır.
create index if not exists idx_order_items_product_id on public.order_items (product_id);
create index if not exists idx_order_items_variant_id on public.order_items (variant_id);

-- ----------------------------------------------------------------
-- L6 — moderator kendi profilini güncelleyebilsin (rol yükseltmeden)
-- ----------------------------------------------------------------
-- Kullanıcının veritabanındaki MEVCUT rolünü döndüren yardımcı. security definer +
-- sabit search_path. stable olduğu için UPDATE ifadesinin başındaki anlık görüntüyle
-- değerlendirilir → güncellemeden ÖNCEKİ rolü görür, bu yüzden "rol değiştirilemez"
-- kontrolü güvenilir çalışır.
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.my_role());
