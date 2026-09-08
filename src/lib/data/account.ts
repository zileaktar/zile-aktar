import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface CheckoutPrefill {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
}

/**
 * Giriş yapmış kullanıcının kayıtlı teslimat adresleri (varsayılan önce, sonra
 * yeni eklenen önce). Giriş yoksa boş dizi. Kullanıcının kendi oturumuyla —
 * RLS `addresses_all_own` politikası geçerli.
 */
export async function listAddresses(): Promise<SavedAddress[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('addresses')
    .select('id, label, full_name, phone, city, district, address_line, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.full_name,
    phone: a.phone,
    city: a.city,
    district: a.district,
    addressLine: a.address_line,
    isDefault: a.is_default
  }));
}

/**
 * Giriş yapmış kullanıcı için checkout formunu önceden doldurur:
 * e-posta -> auth, ad/telefon -> profiles, adres -> kayıtlı adres ya da son sipariş.
 * Giriş yoksa null döner (misafir alışverişi).
 */
export async function getCheckoutPrefill(): Promise<CheckoutPrefill | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: addr }, { data: lastOrder }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
    supabase
      .from('addresses')
      .select('full_name, phone, city, district, address_line')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('shipping_address, contact_phone')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const a = addr ?? null;
  const o = lastOrder?.shipping_address ?? null;

  return {
    email: user.email ?? '',
    fullName: profile?.full_name || a?.full_name || o?.full_name || '',
    phone: profile?.phone || a?.phone || o?.phone || lastOrder?.contact_phone || '',
    city: a?.city || o?.city || '',
    district: a?.district || o?.district || '',
    addressLine: a?.address_line || o?.address_line || ''
  };
}

export interface AccountOverview {
  email: string;
  fullName: string;
  phone: string;
  address: { fullName: string; phone: string; city: string; district: string; addressLine: string } | null;
}

/** /hesabim sayfası için profil + kayıtlı adres. */
export async function getAccountOverview(): Promise<AccountOverview | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: addr }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
    supabase
      .from('addresses')
      .select('full_name, phone, city, district, address_line')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    email: user.email ?? '',
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: addr
      ? { fullName: addr.full_name, phone: addr.phone, city: addr.city, district: addr.district, addressLine: addr.address_line }
      : null
  };
}
