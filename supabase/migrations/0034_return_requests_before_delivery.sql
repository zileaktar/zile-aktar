-- ================================================================
-- İADE/İPTAL TALEBİ — TESLİMATTAN ÖNCE DE AÇILABİLSİN
--
-- migration 0033'te self-servis talep yalnızca `delivered` siparişler için
-- açılabiliyordu. Gerçekte müşteri, ödemesi geçmiş ama henüz teslim
-- almadığı bir siparişi de (kargoya çıkmadan veya kargodayken) iptal etmek
-- isteyebilir — bu INSERT politikasını genişletir: `paid`, `shipped`,
-- `delivered` durumlarının HERHANGİ birinde talep açılabilir. `pending`
-- (ödeme henüz alınmamış) ve `failed`/`cancelled`/`refunded` hariç kalır.
-- ================================================================

drop policy if exists "return_requests_insert_own" on public.return_requests;
create policy "return_requests_insert_own" on public.return_requests
  for insert
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = (select auth.uid())
        and o.status in ('paid', 'shipped', 'delivered')
    )
  );
