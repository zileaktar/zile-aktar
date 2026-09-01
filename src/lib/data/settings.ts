import 'server-only';
import { unstable_cache } from 'next/cache';
import { createSupabaseAnonServerClient } from '@/lib/supabase/server';

/**
 * Site ayarları (şimdilik yalnızca logo) 5 dakika önbelleklenir; admin bir
 * logo yüklediğinde revalidateTag('site-settings') ile anında geçersiz kılınır
 * (bkz. src/app/admin/ayarlar/actions.ts). `createSupabaseAnonServerClient()`
 * KASITLI kullanılır — bkz. getCategories() (src/lib/data/products.ts) içindeki
 * aynı notu: unstable_cache içinde cookies() kullanan bir istemci Next.js
 * build hatasına yol açar.
 */
export const getSiteSettings = unstable_cache(
  async () => {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('logo_path, bank_account_holder, bank_name, bank_iban, bank_note')
      .eq('id', true)
      .single();
    if (error) throw new Error(`Site ayarları alınamadı: ${error.message}`);
    return {
      logoPath: data.logo_path,
      bank: {
        accountHolder: data.bank_account_holder,
        bankName: data.bank_name,
        iban: data.bank_iban,
        note: data.bank_note
      }
    };
  },
  ['site-settings'],
  { revalidate: 300, tags: ['site-settings'] }
);
