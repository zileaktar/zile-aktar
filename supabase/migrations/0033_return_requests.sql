-- ================================================================
-- SELF-SERVİS İADE TALEBİ
--
-- Müşteri, teslim aldığı bir sipariş için "Siparişlerim"den iade talebi
-- açabilir; admin `/admin/iadeler`'den onaylar/reddeder. Yalnızca GİRİŞ
-- YAPMIŞ kullanıcının KENDİ siparişi için, sipariş durumu `delivered`
-- iken açılabilir (RLS INSERT politikasında zorlanır — istemci tarafı
-- kontrol atlatılamaz). Misafir siparişleri şu an kapsam dışı (telefon/
-- e-posta ile iletişim yolu zaten var, bkz. LEGAL.iadeIcinIletisim).
--
-- `orders.delivered_at`: iade süresi penceresini (KVKK/mevzuat: cayma
-- hakkı LEGAL.caymaSuresiGun) hesaplayabilmek için — "teslim edildi"
-- durumuna admin panelinden geçilince (bkz. /admin/siparisler) yazılır.
-- ================================================================

alter table public.orders
  add column if not exists delivered_at timestamptz;

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  detail text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_return_requests_order_id on public.return_requests(order_id);
create index if not exists idx_return_requests_user_id on public.return_requests(user_id);

alter table public.return_requests enable row level security;

drop policy if exists "return_requests_select_own_or_staff" on public.return_requests;
create policy "return_requests_select_own_or_staff" on public.return_requests
  for select using (user_id = (select auth.uid()) or public.is_staff());

-- İstemci yalnızca kendi TESLİM EDİLMİŞ siparişi için, 'pending' durumunda
-- talep açabilir — status'ü doğrudan 'approved' vererek moderasyonu
-- atlatamaz (bkz. reviews_insert_own ile aynı desen, migration 0013/0028).
drop policy if exists "return_requests_insert_own" on public.return_requests;
create policy "return_requests_insert_own" on public.return_requests
  for insert
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid()) and o.status = 'delivered'
    )
  );

-- Onay/red yalnızca staff — müşteri kendi talebini sonradan değiştiremez/silemez.
drop policy if exists "return_requests_update_staff" on public.return_requests;
create policy "return_requests_update_staff" on public.return_requests
  for update using (public.is_staff()) with check (public.is_staff());
