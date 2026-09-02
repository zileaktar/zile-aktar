-- ================================================================
-- VARYANT BAZINDA İNDİRİM
--
-- `price_cents` = müşterinin ödeyeceği GERÇEK (indirimli) fiyat.
-- `compare_at_price_cents` = indirimden önceki fiyat (üstü çizili gösterilir).
-- NULL ise indirim yok. Ödeme/sipariş hesabı yalnızca `price_cents` kullanır —
-- bu sütun tamamen görseldir (create_order'a dokunulmadı).
-- ================================================================

alter table public.product_variants add column if not exists compare_at_price_cents integer;

-- İndirimsiz fiyat, satış fiyatından büyük olmalı (ya da NULL).
do $$ begin
  alter table public.product_variants
    add constraint product_variants_compare_at_price_check
    check (compare_at_price_cents is null or compare_at_price_cents > price_cents);
exception when duplicate_object then null;
end $$;
