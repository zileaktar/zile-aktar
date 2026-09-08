-- ================================================================
-- ÇOKLU ADRES YÖNETİMİ — tek varsayılan adres garantisi
--
-- `addresses` tablosu baştan beri kullanıcı başına birden fazla satırı
-- (label, is_default) destekliyordu; şimdiye kadar UI tek adres modeliyle
-- çalışıyordu. Çoklu adres yönetimi eklenince, aynı kullanıcının birden
-- fazla satırında `is_default = true` olması karışıklık yaratır
-- (checkout hangisini seçeceğini bilemez).
--
-- Çözüm: BEFORE INSERT/UPDATE trigger — bir satır varsayılan yapılınca
-- aynı kullanıcının diğer tüm adreslerinin varsayılanı otomatik kaldırılır.
-- Trigger service_role dahil tüm yollar için çalışır; sunucu action'ı veya
-- /api/checkout yanlışlıkla iki varsayılan bırakamaz.
-- ================================================================

create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_default then
    update public.addresses
      set is_default = false
      where user_id = new.user_id
        and id <> new.id
        and is_default;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_addresses_single_default on public.addresses;
create trigger trg_addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function public.enforce_single_default_address();

-- Mevcut veride birden fazla varsayılan varsa en yenisini koru, kalanları düşür.
with ranked as (
  select id, row_number() over (partition by user_id order by created_at desc) as rn
  from public.addresses
  where is_default
)
update public.addresses a
  set is_default = false
  from ranked r
  where a.id = r.id and r.rn > 1;
