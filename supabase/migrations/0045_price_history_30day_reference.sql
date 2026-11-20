-- ================================================================
-- İNDİRİMDE "SON 30 GÜNÜN EN DÜŞÜK FİYATI" KURALI
--
-- Fiyat Etiketi Yönetmeliği + Ticari Reklam ve Haksız Ticari Uygulamalar
-- Yönetmeliği: indirimli satışta "indirim öncesi fiyat" olarak, indirimin
-- uygulandığı tarihten önceki 30 gün içindeki EN DÜŞÜK fiyat gösterilir;
-- ispat yükü satıcıdadır.
--
--  1) product_variant_price_history: her fiyat değişikliği zaman damgasıyla
--     kaydedilir (trigger — uygulama atlatamaz). İspat kaydıdır.
--  2) product_variants.compare_at_price_cents (üstü çizili fiyat) artık
--     ELLE belirlenen bir tutar DEĞİL, "indirim göster" işaretidir: kaydedilirken
--     trigger onu, mevcut fiyatın başladığı andan önceki 30 gündeki en düşük
--     fiyata eşitler. Böyle bir fiyat yoksa veya mevcut fiyattan yüksek değilse
--     NULL yapılır (indirim gösterilmez). Admin formu, toplu CSV vb. tüm yollar
--     bu kurala tabidir; sitedeki tüm gösterimler bu sütunu okur.
-- Not: geçmiş bu migration'dan itibaren tutulur (öncesi bilinmiyor).
-- ================================================================

create table if not exists public.product_variant_price_history (
  id bigserial primary key,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  valid_from timestamptz not null default now()
);
create index if not exists idx_price_history_variant_from
  on public.product_variant_price_history(variant_id, valid_from desc);

alter table public.product_variant_price_history enable row level security;
drop policy if exists "price_history_select_staff" on public.product_variant_price_history;
create policy "price_history_select_staff" on public.product_variant_price_history
  for select using (public.is_staff());
revoke insert, update, delete, truncate on public.product_variant_price_history from anon, authenticated;

-- p_before anından önceki 30 gün içinde GEÇERLİ OLMUŞ fiyatların en düşüğü.
-- Her geçmiş satırı, bir sonraki satırın valid_from'una kadar geçerlidir.
create or replace function public.variant_reference_price_cents(p_variant_id uuid, p_before timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select min(s.price_cents)
  from (
    select h.price_cents, h.valid_from,
           lead(h.valid_from) over (order by h.valid_from, h.id) as valid_to
    from public.product_variant_price_history h
    where h.variant_id = p_variant_id
  ) s
  where s.valid_from < p_before
    and coalesce(s.valid_to, 'infinity'::timestamptz) > p_before - interval '30 days';
$$;

-- Yalnız trigger'lar kullanır; istemci RPC ile çağıramaz.
revoke execute on function public.variant_reference_price_cents(uuid, timestamptz) from public, anon, authenticated;

-- BEFORE: üstü çizili fiyatı yasal referansa eşitle.
create or replace function public.product_variants_enforce_reference_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_ref integer;
begin
  if new.compare_at_price_cents is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    -- Yeni üründe geçmiş fiyat yok → indirim iddia edilemez.
    new.compare_at_price_cents := null;
    return new;
  end if;
  if new.price_cents is distinct from old.price_cents then
    v_start := now(); -- indirim (yeni fiyat) şimdi başlıyor
  else
    select max(h.valid_from) into v_start
    from public.product_variant_price_history h where h.variant_id = new.id;
    v_start := coalesce(v_start, now());
  end if;
  v_ref := public.variant_reference_price_cents(new.id, v_start);
  if v_ref is null or v_ref <= new.price_cents then
    new.compare_at_price_cents := null;
  else
    new.compare_at_price_cents := v_ref;
  end if;
  return new;
end;
$$;

-- AFTER: fiyat değiştiyse geçmişe yaz.
create or replace function public.product_variants_log_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.price_cents is distinct from old.price_cents then
    insert into public.product_variant_price_history(variant_id, price_cents, valid_from)
    values (new.id, new.price_cents, now());
  end if;
  return null;
end;
$$;

drop trigger if exists product_variants_enforce_reference_price on public.product_variants;
create trigger product_variants_enforce_reference_price
  before insert or update of price_cents, compare_at_price_cents on public.product_variants
  for each row execute function public.product_variants_enforce_reference_price();

drop trigger if exists product_variants_log_price on public.product_variants;
create trigger product_variants_log_price
  after insert or update of price_cents on public.product_variants
  for each row execute function public.product_variants_log_price();

-- Mevcut varyantlar: bugünkü fiyat geçmişin ilk kaydı olur.
insert into public.product_variant_price_history(variant_id, price_cents, valid_from)
select v.id, v.price_cents, now()
from public.product_variants v
where not exists (select 1 from public.product_variant_price_history h where h.variant_id = v.id);

-- Mevcut üstü çizili fiyatlar kurala göre yeniden hesaplanır (geçmiş olmadığı için temizlenir).
update public.product_variants
set compare_at_price_cents = compare_at_price_cents
where compare_at_price_cents is not null;
