-- ================================================================
-- FAVORİLER / İSTEK LİSTESİ
--
-- Yalnızca giriş yapmış kullanıcılar için (misafir sepeti gibi localStorage'a
-- yayılmıyor — cihazlar arası senkron ve basitlik için tek kaynak DB).
-- RLS: kullanıcı yalnızca kendi favorilerini görebilir/ekleyebilir/silebilir.
-- ================================================================

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_product_id on public.favorites(product_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
