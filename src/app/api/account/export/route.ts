import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generalApiRateLimit, getClientIp, safeRateLimit } from '@/lib/rate-limit';
import { checkTrustedOrigin } from '@/lib/csrf';

export const runtime = 'nodejs';

/**
 * KVKK m.11 / GDPR Madde 15 — Veri Taşınabilirliği ve Erişim Hakkı.
 * Kullanıcı, sistemde kendisiyle ilgili tutulan TÜM veriyi makine-okunabilir
 * (JSON) formatta indirebilir. Sorgular RLS ile zaten kullanıcının kendi
 * verisiyle sınırlıdır; burada ayrıca route seviyesinde de auth kontrolü yapılır.
 *
 * POST (GET değil): bu uç nokta bir `data_requests` denetim kaydı YAZAR (yan
 * etkili). Yan etkili bir GET, <img>/<link> gibi öğelerle veya basit cross-origin
 * isteklerle tetiklenebilir; POST + Origin doğrulaması (checkTrustedOrigin) bunu engeller.
 */
export async function POST(request: Request) {
  const csrfResponse = checkTrustedOrigin(request);
  if (csrfResponse) return csrfResponse;

  const ip = getClientIp(request.headers);
  const { success } = await safeRateLimit(generalApiRateLimit, ip);
  if (!success) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Bu işlem için giriş yapmalısınız.' }, { status: 401 });
  }

  try {
    const [{ data: profile }, { data: addresses }, { data: orders }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('addresses').select('*').eq('user_id', user.id),
      supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id)
    ]);

    await supabase.from('data_requests').insert({
      user_id: user.id,
      user_email_snapshot: user.email ?? 'bilinmiyor',
      type: 'export',
      status: 'completed'
    });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, createdAt: user.created_at },
      profile,
      addresses,
      orders
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kokten-aktar-verilerim-${user.id}.json"`
      }
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Veri dışa aktarılamadı.' }, { status: 500 });
  }
}
