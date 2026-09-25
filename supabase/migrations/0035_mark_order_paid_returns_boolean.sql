-- ================================================================
-- mark_order_paid ARTIK GERÇEKTEN GÜNCELLEME YAPIP YAPMADIĞINI DÖNDÜRÜR
--
-- Önceki hali `returns void` idi ve yalnızca status='pending' siparişi
-- güncelliyordu — çağıran taraf güncellemenin olup olmadığını bilemiyordu.
-- Sipariş o anda 'failed' ise (ör. cron 24 saatte iptal etti, ya da önceki
-- bir başarısız dönüş iptal etti) banka parayı çekmiş olsa bile sipariş
-- "ödendi" olmuyor, ama uygulama yine de müşteriye "Siparişiniz Alındı"
-- gösterip onay e-postası gönderiyordu (para tahsil edildi, sipariş kayıp).
--
-- Artık boolean döner: true = bu çağrı siparişi pending→paid yaptı.
-- Uygulama false gelince siparişin gerçek durumunu okuyup karar verir
-- (bkz. src/lib/payments.ts confirmVakifbankPayment).
--
-- Dönüş tipi değiştiği için CREATE OR REPLACE yetmez, önce DROP gerekir.
-- ================================================================

drop function if exists public.mark_order_paid(uuid, text);

create function public.mark_order_paid(p_order_id uuid, p_payment_ref text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.orders
  set status = 'paid', payment_ref = p_payment_ref
  where id = p_order_id and status = 'pending';
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
