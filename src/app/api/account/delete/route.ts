import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { deleteAccountSchema } from '@/lib/validations/account';
import { authRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';

export const runtime = 'nodejs';

/**
 * KVKK m.7 / GDPR Madde 17 — Silme Hakkı ("unutulma hakkı").
 * Kullanıcı, tam onay metnini yazarak kendi hesabını ve kişisel verilerini
 * kalıcı olarak silebilir. Sipariş KAYITLARI (fatura/muhasebe yükümlülüğü,
 * Vergi Usul Kanunu m.253 vb. yasal saklama süreleri nedeniyle) SİLİNMEZ;
 * bunun yerine orders.user_id "on delete set null" ile anonimleştirilir —
 * kişisel bağlantı kopar ama mali kayıt bütünlüğü korunur.
 */
export async function POST(request: Request) {
  const csrfResponse = checkTrustedOrigin(request);
  if (csrfResponse) return csrfResponse;

  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(authRateLimit, ip);
  if (!success) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Bu işlem için giriş yapmalısınız.' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Onay metni hatalı.', details: parsed.error.flatten() }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceRoleClient();

  try {
    // Denetim kaydı ÖNCE atılır (user_id set null ile hayatta kalır, bkz. migration 0001).
    await serviceClient.from('data_requests').insert({
      user_id: user.id,
      user_email_snapshot: user.email ?? 'bilinmiyor',
      type: 'delete',
      status: 'completed'
    });

    // auth.users silinince profiles/addresses/carts/cart_items CASCADE ile silinir,
    // orders.user_id ise SET NULL ile anonimleşir (bkz. migration 0001 FK tanımları).
    const { error } = await serviceClient.auth.admin.deleteUser(user.id);
    if (error) throw error;

    const response = NextResponse.json({ success: true });
    // Oturum çerezlerini de temizle.
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Hesap silinemedi. Lütfen destek ile iletişime geçin.' }, { status: 500 });
  }
}
