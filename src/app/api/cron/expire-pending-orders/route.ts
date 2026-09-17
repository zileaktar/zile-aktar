import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { sendPaymentReminderEmail } from '@/lib/email';
import { env } from '@/lib/env.mjs';

export const runtime = 'nodejs';

/** Sabit zamanlı karşılaştırma — CRON_SECRET'i basit `!==` ile karşılaştırmak
 * (uzunluk farkı önce döndüğü için) teorik bir zamanlama saldırısına açık bırakır. */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Vercel Cron ile günde bir kez tetiklenir (bkz. vercel.json — Hobby planda
 * günde 1'den sık cron çalıştırılamıyor; Vercel Pro'ya geçilince sıklaştırılabilir).
 * İki iş yapar, sırayla:
 *
 *  1. "Terk edilmiş sepet" hatırlatması — kart ödemesine başlayıp (3DS'e
 *     yönlenip) tamamlamamış, en az 1 saattir `pending` olan ve daha önce
 *     hatırlatma gitmemiş siparişlere BİR kez e-posta gönderir.
 *  2. 24 saatten uzun süredir "pending" kalan siparişler (kullanıcı hiç
 *     tamamlamadan tamamen vazgeçmiş olabilir) başarısız işaretlenir ve
 *     mark_order_failed RPC'si rezerve edilen stoğu otomatik iade eder —
 *     aksi halde satılmayan ürünler sonsuza kadar "stokta yok" görünür kalırdı.
 *
 * İkisi de yalnızca KART (iyzico) siparişlerini kapsar. Havale/EFT siparişleri
 * operasyon ekibi tarafından elle yönetilir (dekont beklenir) — ne hatırlatma
 * ne otomatik iptal uygulanır.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  if (!timingSafeEqualString(authHeader, `Bearer ${env.CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = Date.now();
  const reminderCutoff = new Date(now - 60 * 60 * 1000).toISOString(); // 1 saatten eski
  const expireCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString(); // 24 saatten eski

  // 1) Hatırlatma: 1-24 saat arası pending, daha önce hatırlatma gitmemiş.
  const { data: reminderOrders, error: reminderError } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('payment_provider', 'iyzico')
    .is('reminder_sent_at', null)
    .lt('created_at', reminderCutoff)
    .gte('created_at', expireCutoff);

  if (reminderError) Sentry.captureException(reminderError);

  for (const order of reminderOrders ?? []) {
    await sendPaymentReminderEmail(order.id);
    await supabase.from('orders').update({ reminder_sent_at: new Date().toISOString() }).eq('id', order.id);
  }

  // 2) İptal: 24 saatten eski pending siparişler.
  const { data: staleOrders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('payment_provider', 'iyzico')
    .lt('created_at', expireCutoff);

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Sorgu başarısız.' }, { status: 500 });
  }

  for (const order of staleOrders ?? []) {
    await supabase.rpc('mark_order_failed', { p_order_id: order.id });
  }

  return NextResponse.json({ remindedCount: reminderOrders?.length ?? 0, expiredCount: staleOrders?.length ?? 0 });
}
