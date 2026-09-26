-- ================================================================
-- 0037 — Yönetim panelinden sipariş iptali / iadesi
--
-- * refund_started_at: iptal/iade işlemi için "kilit". Admin düğmeye iki kez
--   basarsa (ya da iki sekmeden aynı anda) bankaya İKİ KEZ iade isteği
--   gitmesin diye, işlem başlamadan önce bu alan NULL → now() yapılır
--   (koşullu UPDATE — yalnız biri kazanır). Banka isteği başarısız olursa
--   tekrar NULL'a çekilir.
-- * refund_ref: bankanın iptal/iade işlem numarası (TransactionId).
-- * cancelled_at: sipariş iptal/iade durumuna ne zaman alındı.
-- * close_order_with_restock: siparişi 'cancelled' veya 'refunded' yapar,
--   istenirse stoğu geri ekler. Yalnızca açık (pending/paid/shipped/delivered)
--   bir siparişi kapatır; aynı sipariş için ikinci çağrı hiçbir şey yapmaz
--   (stok iki kez eklenmez) ve false döner.
-- ================================================================

alter table public.orders add column if not exists refund_started_at timestamptz;
alter table public.orders add column if not exists refund_ref text;
alter table public.orders add column if not exists cancelled_at timestamptz;

create or replace function public.close_order_with_restock(
  p_order_id uuid,
  p_new_status public.order_status,
  p_restock boolean,
  p_refund_ref text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
begin
  if p_new_status not in ('cancelled', 'refunded') then
    raise exception 'close_order_with_restock: geçersiz durum %', p_new_status;
  end if;

  update public.orders
     set status = p_new_status,
         cancelled_at = now(),
         refund_ref = coalesce(p_refund_ref, refund_ref)
   where id = p_order_id
     and status in ('pending', 'paid', 'shipped', 'delivered');
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return false;
  end if;

  if p_restock then
    for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
    loop
      update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
    end loop;
  end if;

  return true;
end;
$$;

revoke all on function public.close_order_with_restock(uuid, public.order_status, boolean, text) from public, anon, authenticated;
grant execute on function public.close_order_with_restock(uuid, public.order_status, boolean, text) to service_role;
