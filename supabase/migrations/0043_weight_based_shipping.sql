-- ================================================================
-- 0043 — AĞIRLIĞA GÖRE KARGO ÜCRETİ
--
-- Önceden kargo create_order + preview_coupon içinde SABİTTİ (700 TL üzeri
-- ücretsiz, altı 39,90 TL). Artık:
--   * Her varyantın paketli ağırlığı: product_variants.weight_grams
--     (boşsa shipping_settings.default_item_grams kullanılır).
--   * Kargo ücreti tablosu (ağırlık aralıkları) shipping_rates'te, genel
--     ayarlar shipping_settings'te (tek satır) — admin panelden düzenlenir.
--   * Hesap TEK yerde: calc_shipping_cents(). create_order, preview_coupon ve
--     quote_cart bunu çağırır. TypeScript tarafındaki önizleme
--     (src/lib/shipping.ts calcShippingCents) ile AYNI kural.
--
-- Kural: ara toplam >= free_threshold_cents ise 0. Değilse
--   toplam ağırlık = ürünlerin ağırlığı + packaging_grams (koli/ambalaj payı);
--   bu ağırlığı karşılayan en küçük aralığın ücreti; en büyük aralık da
--   aşılırsa o aralığın ücreti + aşan her (başlamış) kg için extra_per_kg_cents.
--
-- Başlangıç verisi bugünkü davranışla BİREBİR aynıdır (30 kg'a kadar 39,90 TL,
-- 700 TL üzeri ücretsiz) — admin yeni fiyatları girene kadar müşteri bir fark görmez.
-- ================================================================

-- 1) Varyant ağırlığı
alter table public.product_variants add column if not exists weight_grams integer;
do $$ begin
  alter table public.product_variants
    add constraint product_variants_weight_grams_check check (weight_grams is null or weight_grams between 1 and 100000);
exception when duplicate_object then null; end $$;

-- Mevcut varyantların ağırlığını etiketten çıkar ("250 g", "250gr", "1 kg",
-- "500 ml", "1 lt"). ml ≈ g kabul edilir (şişe ağırlığı admin'den düzeltilir).
-- "1 adet" gibi etiketler boş kalır → varsayılan ağırlık kullanılır.
update public.product_variants
set weight_grams = round(
  replace(substring(label from '([0-9]+(?:[.,][0-9]+)?)'), ',', '.')::numeric
  * case when label ~* '[0-9]\s*(kg|kilo|lt|litre|l)\y' then 1000 else 1 end
)::integer
where weight_grams is null
  and label ~* '^\s*[0-9]+([.,][0-9]+)?\s*(g|gr|gram|kg|kilo|ml|lt|litre|l)\y';

-- Sınır dışı kalan (ör. "0 g") değerleri temizle — check kısıtına takılmasın.
update public.product_variants set weight_grams = null where weight_grams is not null and (weight_grams < 1 or weight_grams > 100000);

-- 2) Siparişte kargo ağırlığı (kargoya verirken bilgi amaçlı)
alter table public.orders add column if not exists shipping_weight_grams integer;

-- 3) Genel kargo ayarları (tek satır)
create table if not exists public.shipping_settings (
  id smallint primary key default 1 check (id = 1),
  -- NULL = ücretsiz kargo eşiği yok
  free_threshold_cents integer check (free_threshold_cents is null or free_threshold_cents >= 0),
  default_item_grams integer not null default 250 check (default_item_grams between 1 and 100000),
  packaging_grams integer not null default 0 check (packaging_grams between 0 and 100000),
  extra_per_kg_cents integer not null default 0 check (extra_per_kg_cents between 0 and 10000000),
  updated_at timestamptz not null default now()
);
insert into public.shipping_settings (id, free_threshold_cents) values (1, 70000) on conflict (id) do nothing;

-- 4) Ağırlık aralıkları: "max_grams'a kadar price_cents"
create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  max_grams integer not null unique check (max_grams between 1 and 1000000),
  price_cents integer not null check (price_cents between 0 and 10000000),
  created_at timestamptz not null default now()
);
insert into public.shipping_rates (max_grams, price_cents)
select 30000, 3990 where not exists (select 1 from public.shipping_rates);

-- RLS: herkes okur (ücretler sitede gösteriliyor), yalnız admin (AAL2, is_admin) yazar.
alter table public.shipping_settings enable row level security;
alter table public.shipping_rates enable row level security;

drop policy if exists "shipping_settings_public_read" on public.shipping_settings;
create policy "shipping_settings_public_read" on public.shipping_settings for select using (true);
drop policy if exists "shipping_settings_admin_write" on public.shipping_settings;
create policy "shipping_settings_admin_write" on public.shipping_settings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shipping_rates_public_read" on public.shipping_rates;
create policy "shipping_rates_public_read" on public.shipping_rates for select using (true);
drop policy if exists "shipping_rates_admin_insert" on public.shipping_rates;
create policy "shipping_rates_admin_insert" on public.shipping_rates for insert with check (public.is_admin());
drop policy if exists "shipping_rates_admin_update" on public.shipping_rates;
create policy "shipping_rates_admin_update" on public.shipping_rates
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "shipping_rates_admin_delete" on public.shipping_rates;
create policy "shipping_rates_admin_delete" on public.shipping_rates for delete using (public.is_admin());

-- Admin kaydı TEK işlemde (ayarlar + tüm aralıklar birlikte değişir; yarım kayıt olmaz).
-- is_admin() AAL2 (iki adımlı doğrulama) şartını da içerir (migration 0036).
create or replace function public.save_shipping_config(
  p_free_threshold_cents integer,
  p_default_item_grams integer,
  p_packaging_grams integer,
  p_extra_per_kg_cents integer,
  p_rates jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_array_length(coalesce(p_rates, '[]'::jsonb)) = 0 then
    raise exception 'RATES_REQUIRED';
  end if;

  update public.shipping_settings
  set free_threshold_cents = p_free_threshold_cents,
      default_item_grams = p_default_item_grams,
      packaging_grams = p_packaging_grams,
      extra_per_kg_cents = p_extra_per_kg_cents,
      updated_at = now()
  where id = 1;

  -- "where true": Supabase safeupdate eklentisi WHERE'siz DELETE'i reddeder.
  delete from public.shipping_rates where true;
  insert into public.shipping_rates (max_grams, price_cents)
  select x.max_grams, x.price_cents
  from jsonb_to_recordset(p_rates) as x(max_grams integer, price_cents integer);
end;
$$;

revoke all on function public.save_shipping_config(integer, integer, integer, integer, jsonb) from public, anon;
grant execute on function public.save_shipping_config(integer, integer, integer, integer, jsonb) to authenticated;

-- 5) Tek hesap fonksiyonu
create or replace function public.calc_shipping_cents(p_subtotal_cents integer, p_items_weight_grams integer)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings record;
  v_weight integer;
  v_price integer;
  v_last record;
begin
  if coalesce(p_subtotal_cents, 0) <= 0 then
    return 0;
  end if;

  select * into v_settings from public.shipping_settings where id = 1;
  if not found then
    raise exception 'SHIPPING_NOT_CONFIGURED';
  end if;

  if v_settings.free_threshold_cents is not null and p_subtotal_cents >= v_settings.free_threshold_cents then
    return 0;
  end if;

  v_weight := greatest(0, coalesce(p_items_weight_grams, 0)) + v_settings.packaging_grams;

  select r.price_cents into v_price
  from public.shipping_rates r
  where r.max_grams >= v_weight
  order by r.max_grams
  limit 1;
  if found then
    return v_price;
  end if;

  select r.max_grams, r.price_cents into v_last from public.shipping_rates r order by r.max_grams desc limit 1;
  if not found then
    raise exception 'SHIPPING_NOT_CONFIGURED';
  end if;
  return v_last.price_cents + ceil((v_weight - v_last.max_grams) / 1000.0)::integer * v_settings.extra_per_kg_cents;
end;
$$;

revoke all on function public.calc_shipping_cents(integer, integer) from public, anon, authenticated;
grant execute on function public.calc_shipping_cents(integer, integer) to service_role;

-- 6) Sepet önizlemesi: ara toplam + ağırlık + kargo (fiyat/ağırlık DB'den)
create or replace function public.quote_cart(p_items jsonb)
returns table (subtotal_cents integer, weight_grams integer, shipping_cents integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_subtotal integer := 0;
  v_weight integer := 0;
  v_default_grams integer;
begin
  select s.default_item_grams into v_default_grams from public.shipping_settings s where s.id = 1;
  v_default_grams := coalesce(v_default_grams, 250);

  select
    coalesce(sum(pv.price_cents * least(greatest(x.quantity, 0), 20)), 0),
    coalesce(sum(coalesce(pv.weight_grams, v_default_grams) * least(greatest(x.quantity, 0), 20)), 0)
  into v_subtotal, v_weight
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as x(variant_id uuid, quantity integer)
  join public.product_variants pv on pv.id = x.variant_id
  join public.products p on p.id = pv.product_id and p.is_active = true;

  return query select v_subtotal, v_weight, public.calc_shipping_cents(v_subtotal, v_weight);
end;
$$;

revoke all on function public.quote_cart(jsonb) from public, anon, authenticated;
grant execute on function public.quote_cart(jsonb) to service_role;

-- 7) create_order: 0020 ile aynı, kargo artık calc_shipping_cents + ağırlık
create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_contact_email text,
  p_contact_phone text,
  p_payment_provider text,
  p_user_id uuid,
  p_coupon_code text default null
)
returns table (
  order_id uuid, order_number text, subtotal_cents integer,
  shipping_cents integer, deal_discount_cents integer, discount_cents integer, total_cents integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_deal_discount integer := 0;
  v_discount integer := 0;
  v_total integer := 0;
  v_weight integer := 0;
  v_default_grams integer;
  v_item record;
  v_variant record;
  v_coupon record;
  v_coupon_code text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  v_prior_uses integer;
  v_group integer;
  v_discounted_units integer;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select s.default_item_grams into v_default_grams from public.shipping_settings s where s.id = 1;
  v_default_grams := coalesce(v_default_grams, 250);

  -- 1. GEÇİŞ: satırları kilitle, stok kontrol et, ara toplam + kampanya indirimi + ağırlık.
  for v_item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception 'INVALID_QUANTITY: %', v_item.variant_id;
    end if;

    select pv.id, pv.price_cents, pv.stock, pv.label, pv.weight_grams,
           p.deal_buy_qty, p.deal_get_qty, p.deal_get_percent
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
    v_weight := v_weight + (coalesce(v_variant.weight_grams, v_default_grams) * v_item.quantity);

    if v_variant.deal_buy_qty is not null and v_variant.deal_get_qty is not null and v_variant.deal_get_percent is not null then
      v_group := v_variant.deal_buy_qty + v_variant.deal_get_qty;
      v_discounted_units := (v_item.quantity / v_group) * v_variant.deal_get_qty;
      if v_discounted_units > 0 then
        v_deal_discount := v_deal_discount + (v_discounted_units * v_variant.price_cents * v_variant.deal_get_percent / 100);
      end if;
    end if;
  end loop;

  if v_deal_discount > v_subtotal then
    v_deal_discount := v_subtotal;
  end if;

  v_shipping := public.calc_shipping_cents(v_subtotal, v_weight);

  -- KUPON
  if v_coupon_code is not null then
    select * into v_coupon from public.coupons
    where upper(code) = v_coupon_code and is_active = true
    for update;

    if not found then raise exception 'COUPON_INVALID'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'COUPON_EXPIRED'; end if;
    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then raise exception 'COUPON_EXHAUSTED'; end if;
    if v_subtotal < v_coupon.min_cart_cents then raise exception 'COUPON_MIN_CART: %', v_coupon.min_cart_cents; end if;

    if v_coupon.per_user_once then
      select count(*) into v_prior_uses
      from public.orders o
      where upper(coalesce(o.coupon_code, '')) = v_coupon_code
        and o.status not in ('failed', 'cancelled')
        and (
          (p_user_id is not null and o.user_id = p_user_id)
          or (p_user_id is null and lower(o.contact_email) = lower(p_contact_email))
        );
      if v_prior_uses > 0 then raise exception 'COUPON_ALREADY_USED'; end if;
    end if;

    if v_coupon.type = 'percent' then
      v_discount := (v_subtotal * v_coupon.value) / 100;
    elsif v_coupon.type = 'fixed' then
      v_discount := least(v_coupon.value, v_subtotal);
    elsif v_coupon.type = 'free_shipping' then
      v_shipping := 0;
      v_discount := 0;
    end if;
  end if;

  -- Kombine indirim ara toplamı geçemez — önce kampanya, kalan pay kadar kupon.
  if v_deal_discount + v_discount > v_subtotal then
    v_discount := greatest(0, v_subtotal - v_deal_discount);
  end if;

  v_total := v_subtotal - v_deal_discount - v_discount + v_shipping;
  v_order_number := 'KA-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 1000000)::text, 6, '0');

  insert into public.orders (
    order_number, user_id, status, subtotal_cents, shipping_cents, deal_discount_cents, discount_cents, total_cents,
    shipping_address, payment_provider, contact_email, contact_phone, coupon_code, shipping_weight_grams
  ) values (
    v_order_number, p_user_id, 'pending', v_subtotal, v_shipping, v_deal_discount, v_discount, v_total,
    p_shipping_address, p_payment_provider, p_contact_email, p_contact_phone, v_coupon_code, v_weight
  )
  returning id into v_order_id;

  -- 2. GEÇİŞ: order_items + stok düşümü.
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

  if v_coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where upper(code) = v_coupon_code;
  end if;

  return query select v_order_id, v_order_number, v_subtotal, v_shipping, v_deal_discount, v_discount, v_total;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, uuid, text) to service_role;

-- 8) preview_coupon: ağırlık parametresi eklendi (imza değiştiği için önce eskisi kaldırılır)
drop function if exists public.preview_coupon(text, integer, uuid, text);

create or replace function public.preview_coupon(
  p_code text,
  p_subtotal_cents integer,
  p_user_id uuid default null,
  p_email text default null,
  p_weight_grams integer default 0
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
  v_shipping := public.calc_shipping_cents(p_subtotal_cents, p_weight_grams);

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

revoke all on function public.preview_coupon(text, integer, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.preview_coupon(text, integer, uuid, text, integer) to service_role;
