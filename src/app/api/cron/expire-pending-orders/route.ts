import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { sendPaymentReminderEmail } from '@/lib/email';
import { confirmVakifbankPayment } from '@/lib/payments';
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

/** Ödenmemiş kart siparişinin stoğu ne kadar süre ayrılı tutacağı. */
const PENDING_CARD_ORDER_TTL_MS = 60 * 60 * 1000; // 1 saat

/**
 * Vercel Cron ile 15 dakikada bir tetiklenir (bkz. vercel.json). İki iş yapar, sırayla:
 *
 *  1. Ödeme hatırlatması — kart ödemesine başlayıp (3DS'e yönlenip) tamamlamamış,
 *     20-60 dakikadır `pending` olan ve daha önce hatırlatma gitmemiş siparişlere
 *     BİR kez e-posta gönderir.
 *  2. 1 saatten uzun süredir "pending" kalan siparişler (kullanıcı ödemeyi
 *     tamamlamadan vazgeçmiş) başarısız işaretlenir ve mark_order_failed RPC'si
 *     rezerve edilen stoğu otomatik iade eder. Süre bilinçli olarak kısa: sahte
 *     siparişlerle stok kilitlenmesin, gerçek müşteri ürünü "tükendi" görmesin.
 *
 * İkisi de yalnızca KART (vakifbank) siparişlerini kapsar. Havale/EFT siparişleri
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
  const reminderCutoff = new Date(now - 20 * 60 * 1000).toISOString(); // 20 dakikadan eski
  const expireCutoff = new Date(now - PENDING_CARD_ORDER_TTL_MS).toISOString(); // 1 saatten eski

  // 1) Hatırlatma: 20-60 dakika arası pending, daha önce hatırlatma gitmemiş.
  const { data: reminderOrders, error: reminderError } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('payment_provider', 'vakifbank')
    .is('reminder_sent_at', null)
    .lt('created_at', reminderCutoff)
    .gte('created_at', expireCutoff);

  if (reminderError) Sentry.captureException(reminderError);

  for (const order of reminderOrders ?? []) {
    await sendPaymentReminderEmail(order.id);
    await supabase.from('orders').update({ reminder_sent_at: new Date().toISOString() }).eq('id', order.id);
  }

  // 2) İptal: 1 saatten eski pending siparişler.
  const { data: staleOrders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('payment_provider', 'vakifbank')
    .lt('created_at', expireCutoff);

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Sorgu başarısız.' }, { status: 500 });
  }

  // İptal etmeden ÖNCE bankaya sor: müşteri ödemeyi tamamlamış ama dönüş
  // hiç gerçekleşmemiş olabilir (tarayıcı kapandı, dönüş linki süresi doldu).
  // Böyle bir siparişi körlemesine iptal etmek "para çekildi, sipariş kayıp"
  // sonucunu doğururdu.
  let expiredCount = 0;
  let recoveredCount = 0;
  for (const order of staleOrders ?? []) {
    const outcome = await confirmVakifbankPayment(order.id);
    if (outcome.status === 'paid') {
      recoveredCount++;
      continue;
    }
    if (outcome.status === 'failed') {
      // confirmVakifbankPayment zaten failed işaretledi.
      expiredCount++;
      continue;
    }
    if (outcome.reason === 'retrieve_failed') {
      // Banka sorgusu ağ/servis hatası verdi: sonucu bilmeden İPTAL ETME,
      // bir sonraki cron çalışmasında tekrar denenir.
      Sentry.captureMessage(`Cron: sipariş ${order.id} için banka sorgulanamadı, iptal ertelendi`, { level: 'warning' });
      continue;
    }
    // not_final / missing_conversation_id: ödeme hiç sonuçlanmamış → iptal + stok iadesi.
    await supabase.rpc('mark_order_failed', { p_order_id: order.id });
    expiredCount++;
  }

  return NextResponse.json({ remindedCount: reminderOrders?.length ?? 0, expiredCount, recoveredCount });
}
