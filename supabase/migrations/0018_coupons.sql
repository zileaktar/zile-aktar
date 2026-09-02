-- ================================================================
-- İNDİRİM KODU (KUPON) SİSTEMİ
--
-- Kupon doğrulama ve indirim hesabı TAMAMEN sunucuda (create_order içinde)
-- yapılır — istemciden gelen hiçbir indirim tutarına güvenilmez. Kupon satırı
-- yalnızca staff tarafından okunabilir (indirim oranı/limitler müşteriye kapalı);
-- doğrulama service_role ile çalışan create_order/preview fonksiyonlarından geçer.
--
-- Kargo eşiği (15000) ve ücreti (3990) create_order içinde SABİT kalmaya devam
-- eder (src/lib/pricing.ts ile elle senkron).
-- ================================================================

create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,
  type           text not null check (type in ('percent', 'fixed', 'free_shipping')),
  -- percent: 1..100 · fixed: kuruş · free_shipping: kullanılmaz (0)
  value          integer not null default 0,
  min_cart_cents integer not null default 0 check (min_cart_cents >= 0),
  max_uses       integer check (max_uses is null or max_uses > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  per_user_once  boolean not null default false,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint coupons_value_valid check (
    (type = 'percent' and value between 1 and 100)
    or (type = 'fixed' and value > 0)
    or (type = 'free_shipping')
  )
);

-- Kod büyük/küçük harf duyarsız benzersiz.
create unique index if not exists coupons_code_unique on public.coupons (upper(code));

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at before update on public.coupons
  for each row execute procedure public.set_updated_at();

alter table public.coupons enable row level security;

drop policy if exists "coupons_staff_all" on public.coupons;
create policy "coupons_staff_all" on public.coupons
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------
-- orders: uygulanan kupon + indirim tutarı
-- ----------------------------------------------------------------
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_cents integer not null default 0;

-- ----------------------------------------------------------------
-- create_order: p_coupon_code parametresi + indirim hesabı
-- (dönüş tipi değiştiği için önce DROP gerekir)
-- ----------------------------------------------------------------
drop function if exists public.create_order(jsonb, jsonb, text, text, text, uuid);

create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_contact_email text,
  p_contact_phone text,
  p_payment_provider text,
  p_user_id uuid,
  p_coupon_code text default null
)
returns table (order_id uuid, order_number text, subtotal_cents integer, shipping_cents integer, discount_cents integer, total_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_discount integer := 0;
  v_total integer := 0;
  v_item record;
  v_variant record;
  v_free_shipping_threshold constant integer := 15000;
  v_standard_shipping constant integer := 3990;
  v_coupon record;
  v_coupon_code text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  v_prior_uses integer;
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

  -- KUPON: varsa doğrula ve indirimi hesapla (hepsi sunucu tarafında).
  if v_coupon_code is not null then
    select * into v_coupon from public.coupons
    where upper(code) = v_coupon_code and is_active = true
    for update;

    if not found then
      raise exception 'COUPON_INVALID';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'COUPON_EXPIRED';
    end if;
    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
      raise exception 'COUPON_EXHAUSTED';
    end if;
    if v_subtotal < v_coupon.min_cart_cents then
      raise exception 'COUPON_MIN_CART: %', v_coupon.min_cart_cents;
    end if;

    if v_coupon.per_user_once then
      select count(*) into v_prior_uses
      from public.orders o
      where upper(coalesce(o.coupon_code, '')) = v_coupon_code
        and o.status not in ('failed', 'cancelled')
        and (
          (p_user_id is not null and o.user_id = p_user_id)
          or (p_user_id is null and lower(o.contact_email) = lower(p_contact_email))
        );
      if v_prior_uses > 0 then
        raise exception 'COUPON_ALREADY_USED';
      end if;
    end if;

    if v_coupon.type = 'percent' then
      v_discount := (v_subtotal * v_coupon.value) / 100;
    elsif v_coupon.type = 'fixed' then
      v_discount := least(v_coupon.value, v_subtotal);
    elsif v_coupon.type = 'free_shipping' then
      v_shipping := 0;
      v_discount := 0;
    end if;

    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;
  v_order_number := 'KA-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 1000000)::text, 6, '0');

  insert into public.orders (
    order_number, user_id, status, subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_address, payment_provider, contact_email, contact_phone, coupon_code
  ) values (
    v_order_number, p_user_id, 'pending', v_subtotal, v_shipping, v_discount, v_total,
    p_shipping_address, p_payment_provider, p_contact_email, p_contact_phone, v_coupon_code
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

  -- Kupon kullanım sayacını artır (mark_order_failed sipariş iptal olursa geri düşer).
  if v_coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where upper(code) = v_coupon_code;
  end if;

  return query select v_order_id, v_order_number, v_subtotal, v_shipping, v_discount, v_total;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, uuid, text) to service_role;

-- ----------------------------------------------------------------
-- mark_order_failed: stok iadesine ek olarak kupon kullanımını da geri al
-- ----------------------------------------------------------------
create or replace function public.mark_order_failed(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
  v_coupon_code text;
begin
  update public.orders set status = 'failed' where id = p_order_id and status = 'pending'
  returning coupon_code into v_coupon_code;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return;
  end if;

  for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
  end loop;

  if v_coupon_code is not null and v_coupon_code <> '' then
    update public.coupons
    set used_count = greatest(0, used_count - 1)
    where upper(code) = upper(v_coupon_code);
  end if;
end;
$$;

revoke all on function public.mark_order_failed from public, anon, authenticated;
grant execute on function public.mark_order_failed to service_role;

-- ----------------------------------------------------------------
-- preview_coupon: ödeme sayfası için SALT-OKUNUR kupon önizlemesi.
-- Hata fırlatmaz — geçerlilik + indirim tutarını veri olarak döndürür.
-- Kargo eşiği create_order ile aynı (15000 / 3990).
-- ----------------------------------------------------------------
create or replace function public.preview_coupon(
  p_code text,
  p_subtotal_cents integer,
  p_user_id uuid default null,
  p_email text default null
)
returns table (valid boolean, message text, discount_cents integer, free_shipping boolean, shipping_cents integer, final_total_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon record;
  v_code text := nullif(upper(trim(coalesce(p_code, ''))), '');
  v_discount integer := 0;
  v_shipping integer;
  v_free_shipping boolean := false;
  v_prior_uses integer;
begin
  v_shipping := case when p_subtotal_cents >= 15000 then 0 else 3990 end;

  if v_code is null then
    return query select false, 'Kod girin.'::text, 0, false, v_shipping, p_subtotal_cents + v_shipping;
    return;
  end if;

  select * into v_coupon from public.coupons where upper(code) = v_code and is_active = true;
  if not found then
    return query select false, 'Kod geçersiz.'::text, 0, false, v_shipping, p_subtotal_cents + v_shipping;
    return;
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return query select false, 'Kodun süresi dolmuş.'::text, 0, false, v_shipping, p_subtotal_cents + v_shipping;
    return;
  end if;
  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    return query select false, 'Kod kullanım limitine ulaşmış.'::text, 0, false, v_shipping, p_subtotal_cents + v_shipping;
    return;
  end if;
  if p_subtotal_cents < v_coupon.min_cart_cents then
    return query select false,
      ('Bu kod ' || to_char(v_coupon.min_cart_cents / 100.0, 'FM999G990D00') || ' ₺ ve üzeri sepetlerde geçerli.')::text,
      0, false, v_shipping, p_subtotal_cents + v_shipping;
    return;
  end if;
  if v_coupon.per_user_once then
    select count(*) into v_prior_uses from public.orders o
    where upper(coalesce(o.coupon_code, '')) = v_code
      and o.status not in ('failed', 'cancelled')
      and (
        (p_user_id is not null and o.user_id = p_user_id)
        or (p_user_id is null and p_email is not null and lower(o.contact_email) = lower(p_email))
      );
    if v_prior_uses > 0 then
      return query select false, 'Bu kodu daha önce kullandınız.'::text, 0, false, v_shipping, p_subtotal_cents + v_shipping;
      return;
    end if;
  end if;

  if v_coupon.type = 'percent' then
    v_discount := (p_subtotal_cents * v_coupon.value) / 100;
  elsif v_coupon.type = 'fixed' then
    v_discount := least(v_coupon.value, p_subtotal_cents);
  elsif v_coupon.type = 'free_shipping' then
    v_shipping := 0;
    v_free_shipping := true;
  end if;
  if v_discount > p_subtotal_cents then v_discount := p_subtotal_cents; end if;

  return query select true, 'Kod uygulandı.'::text, v_discount, v_free_shipping, v_shipping,
    (p_subtotal_cents - v_discount + v_shipping);
end;
$$;

revoke all on function public.preview_coupon(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.preview_coupon(text, integer, uuid, text) to service_role;
