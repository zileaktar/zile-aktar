-- ================================================================
-- SİPARİŞE ÖZEL SÖZLEŞME ARŞİVİ (ÖBF + Mesafeli Satış Sözleşmesi)
--
-- Mesafeli Sözleşmeler Yönetmeliği m.20: satıcı, bilgilendirme, cayma ve
-- teslimata ilişkin her işlemin bilgi ve belgelerini EN AZ 3 YIL saklar;
-- ispat yükü satıcıdadır. Sipariş anında, müşterinin gördüğü metnin birebir
-- HTML kopyası + SHA-256 özeti + onay zamanı/IP'si bu tabloya yazılır.
--
-- DEĞİŞTİRİLEMEZLİK (service_role dahil herkes için — trigger'lar RLS gibi
-- atlatılamaz):
--   * UPDATE: yalnızca `emailed_at` bir kez (null → zaman) doldurulabilir.
--   * DELETE: `retain_until`'den önce yasak. retain_until = onay + 10 yıl
--     (TTK m.82 ticari belge saklama süresi; KVKK metnindeki "sipariş
--     kayıtları 10 yıl" ile aynı; 3 yıllık asgari süreyi de karşılar).
--   * TRUNCATE: yasak.
--   * orders satırı silinemez (FK ON DELETE RESTRICT) — sipariş silinmek
--     istenirse önce bu kayıtların süresi dolmalı.
-- İstemci (anon/authenticated) yazamaz; yazma yalnız sunucudaki service_role ile.
-- ================================================================

create table if not exists public.order_legal_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  doc_type text not null check (doc_type in ('preliminary_info', 'distance_sales')),
  doc_version text not null,
  content_html text not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  accepted_at timestamptz not null,
  accepted_ip text,
  accepted_user_agent text,
  retain_until timestamptz not null,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, doc_type)
);
create index if not exists idx_order_legal_documents_order_id on public.order_legal_documents(order_id);

create or replace function public.order_legal_documents_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Saklama süresi istemciden/uygulamadan alınmaz, burada sabitlenir.
    new.retain_until := new.accepted_at + interval '10 years';
    new.created_at := now();
    return new;
  elsif tg_op = 'UPDATE' then
    if (new.id, new.order_id, new.doc_type, new.doc_version, new.content_html, new.content_sha256,
        new.accepted_at, new.accepted_ip, new.accepted_user_agent, new.retain_until, new.created_at)
       is distinct from
       (old.id, old.order_id, old.doc_type, old.doc_version, old.content_html, old.content_sha256,
        old.accepted_at, old.accepted_ip, old.accepted_user_agent, old.retain_until, old.created_at) then
      raise exception 'LEGAL_DOC_IMMUTABLE: arşivlenmiş sözleşme değiştirilemez';
    end if;
    if old.emailed_at is not null and new.emailed_at is distinct from old.emailed_at then
      raise exception 'LEGAL_DOC_IMMUTABLE: e-posta gönderim zamanı bir kez yazılır';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.retain_until > now() then
      raise exception 'LEGAL_DOC_RETENTION: sözleşme % tarihine kadar silinemez', old.retain_until;
    end if;
    return old;
  end if;
  raise exception 'LEGAL_DOC_IMMUTABLE: % izinli değil', tg_op;
end;
$$;

drop trigger if exists order_legal_documents_guard_row on public.order_legal_documents;
create trigger order_legal_documents_guard_row
  before insert or update or delete on public.order_legal_documents
  for each row execute function public.order_legal_documents_guard();

drop trigger if exists order_legal_documents_guard_truncate on public.order_legal_documents;
create trigger order_legal_documents_guard_truncate
  before truncate on public.order_legal_documents
  for each statement execute function public.order_legal_documents_guard();

alter table public.order_legal_documents enable row level security;

-- Okuma: siparişin sahibi (giriş yapmış müşteri) ve yetkili personel.
drop policy if exists "order_legal_documents_select_own_or_staff" on public.order_legal_documents;
create policy "order_legal_documents_select_own_or_staff" on public.order_legal_documents
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );
-- INSERT/UPDATE/DELETE politikası YOK → istemci yazamaz. Ek güvence olarak yetkiyi de kaldır.
revoke insert, update, delete, truncate on public.order_legal_documents from anon, authenticated;
