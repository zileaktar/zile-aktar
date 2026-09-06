-- ================================================================
-- GÜVENLİK DENETİMİ BULGUSU — Yorum moderasyon atlatması (M1)
--
-- Sorun: `reviews_insert_own` RLS politikası yalnızca `user_id = auth.uid()`
--   kontrol ediyordu; `status`, `author_name` ve `order_id` alanlarını
--   kısıtlamıyordu. Giriş yapmış bir kullanıcı, sunucu action'ını atlayıp
--   tarayıcıdan doğrudan şunu çağırabiliyordu:
--
--     supabase.from('reviews').insert({
--       product_id, user_id: <kendi id>, rating: 5, body: '...',
--       status: 'approved',          -- moderasyon atlanır, yorum anında yayında
--       author_name: 'Resmi Satıcı', -- isim taklidi
--       order_id: <rastgele>         -- sahte "doğrulanmış alışveriş"
--     })
--
--   Etki: moderasyon kuyruğu devre dışı; sahte olumlu/olumsuz yorum yağmuru,
--   isim taklidi. (XSS değil — render tarafında JSX kaçışı var.)
--
-- Çözüm (iki katman):
--   1. INSERT politikası: status = 'pending' ZORUNLU; order_id ya null ya da
--      gerçekten kullanıcının kendi siparişi.
--   2. BEFORE INSERT trigger: status'ü koşulsuz 'pending' yapar, author_name'i
--      kullanıcının profil adından türetir, geçersiz order_id'yi null'a çeker.
--      Trigger service_role dahil TÜM yollar için çalışır → sunucu action'ı veya
--      ileride eklenecek başka bir yol yanlışlıkla onaylı/taklit yorum yazamaz.
-- ================================================================

-- 1) INSERT politikasını sıkılaştır
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and (
      order_id is null
      or exists (
        select 1 from public.orders o
        where o.id = order_id and o.user_id = (select auth.uid())
      )
    )
  );

-- 2) Sunucu tarafı zorlama — status ve author_name güvenli değerlere sabitlenir
create or replace function public.reviews_enforce_defaults()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Onay durumu her zaman moderasyon kuyruğundan başlar.
  new.status := 'pending';

  -- Yazar adı: yorumu yazan kullanıcının profil adı. İstemcinin gönderdiği
  -- değer yok sayılır (isim taklidini engeller).
  new.author_name := coalesce(
    nullif(btrim((select p.full_name from public.profiles p where p.id = new.user_id)), ''),
    'Zile Aktar Müşterisi'
  );

  -- "Doğrulanmış alışveriş" bağlantısı yalnızca gerçekten bu kullanıcıya ait
  -- bir sipariş için korunur; aksi halde temizlenir.
  if new.order_id is not null and not exists (
    select 1 from public.orders o where o.id = new.order_id and o.user_id = new.user_id
  ) then
    new.order_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reviews_enforce_defaults on public.reviews;
create trigger trg_reviews_enforce_defaults
  before insert on public.reviews
  for each row execute function public.reviews_enforce_defaults();
