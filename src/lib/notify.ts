import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env.mjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents, formatDateTimeTR } from '@/lib/format';

/**
 * Yönetici Telegram bildirimleri — paneli sürekli yenilemek yerine önemli
 * olaylar telefona anında düşer.
 *
 * İlkeler:
 *  - FAIL-OPEN: bildirim gönderilemezse (Telegram erişilemez, anahtar yok)
 *    asıl işlem (sipariş, ödeme onayı) ASLA bozulmaz; hata yalnızca Sentry'ye gider.
 *  - KVKK / veri minimizasyonu: Telegram sunucuları yurt dışında. Mesajlara
 *    müşteri adı, telefonu, e-postası, adresi YAZILMAZ — yalnızca sipariş no,
 *    tutar, ürün adedi, saat ve panel linki. Müşteri bilgisi MFA korumalı panelde.
 *  - Kısa zaman aşımı (5 sn): Telegram yavaşsa kullanıcı yanıtı beklemez.
 *  - Bot anahtarı istek adresinin içinde gider; Sentry'de maskelenir
 *    (bkz. src/lib/sentry-scrub.ts). Hata mesajlarına adres YAZILMAZ.
 */

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(html: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });
    if (!response.ok) {
      Sentry.captureMessage(`Telegram bildirimi gönderilemedi: HTTP ${response.status}`, { level: 'warning' });
    }
  } catch (err) {
    // Hata nesnesi istek adresini (dolayısıyla anahtarı) içerebilir — yalnızca türünü raporla.
    const kind = err instanceof Error ? err.name : 'unknown';
    Sentry.captureMessage(`Telegram bildirimi gönderilemedi: ${kind}`, { level: 'warning' });
  }
}

function adminOrderLink(orderId: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/admin/siparisler/${orderId}`;
}

interface OrderSummary {
  orderNumber: string;
  totalCents: number;
  itemCount: number;
  createdAt: string;
}

async function loadOrderSummary(orderId: string): Promise<OrderSummary | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('orders')
    .select('order_number, total_cents, created_at, order_items(quantity)')
    .eq('id', orderId)
    .single();
  if (!data) return null;
  const items = (data as unknown as { order_items: { quantity: number }[] }).order_items ?? [];
  return {
    orderNumber: data.order_number,
    totalCents: data.total_cents,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: data.created_at
  };
}

function orderLines(orderId: string, s: OrderSummary): string {
  return [
    `Sipariş: <b>${escapeHtml(s.orderNumber)}</b>`,
    `Tutar: <b>${escapeHtml(formatPriceFromCents(s.totalCents))}</b> · ${s.itemCount} ürün`,
    `Zaman: ${escapeHtml(formatDateTimeTR(s.createdAt))}`,
    `<a href="${adminOrderLink(orderId)}">Panelde aç</a>`
  ].join('\n');
}

/** Yeni sipariş: kartta ödeme onaylanınca, havalede sipariş oluşunca. */
export async function notifyNewOrder(orderId: string, method: 'card' | 'havale'): Promise<void> {
  try {
    const summary = await loadOrderSummary(orderId);
    if (!summary) return;
    const title =
      method === 'card' ? '🛒 <b>Yeni sipariş</b> — kartla ödendi' : '🏦 <b>Yeni havale siparişi</b> — ödeme bekleniyor';
    await sendTelegramMessage(`${title}\n\n${orderLines(orderId, summary)}`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'telegram-notify' } });
  }
}

/** Başarısız kart ödemesi (banka reddi veya tutar uyuşmazlığı). */
export async function notifyPaymentFailed(orderId: string, reason: 'not_successful' | 'amount_mismatch'): Promise<void> {
  try {
    const summary = await loadOrderSummary(orderId);
    if (!summary) return;
    const title =
      reason === 'amount_mismatch'
        ? '🚨 <b>Tutar uyuşmazlığı</b> — bankanın çektiği tutar siparişle eşleşmedi, sipariş iptal edildi. Banka panelini kontrol edin.'
        : '❌ <b>Ödeme başarısız</b> — banka reddetti (kart bilgisi/limit/3D). Sipariş iptal edildi, stok geri açıldı.';
    await sendTelegramMessage(`${title}\n\n${orderLines(orderId, summary)}`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'telegram-notify' } });
  }
}

/** Para çekildi ama sipariş kapalı — ACİL, elle iade/iptal gerekir. */
export async function notifyPaidButClosed(orderId: string, transactionId: string | null): Promise<void> {
  try {
    const summary = await loadOrderSummary(orderId);
    const lines = summary ? orderLines(orderId, summary) : `<a href="${adminOrderLink(orderId)}">Panelde aç</a>`;
    await sendTelegramMessage(
      `🚨🚨 <b>KRİTİK: Para çekildi ama sipariş kapalı</b>\n` +
        `VakıfBank ödemeyi aldı, fakat sipariş iptal/başarısız durumdaydı. Müşteriye ürün gönderilmeyecek — ` +
        `VakıfBank panelinden bu işlemi İPTAL/İADE edin ya da siparişi elle yeniden açın.\n` +
        (transactionId ? `Banka işlem no: <code>${escapeHtml(transactionId)}</code>\n` : '') +
        `\n${lines}`
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'telegram-notify' } });
  }
}

/**
 * Müşteri iade/iptal talebi açtı. Sebep sabit bir listeden gelir; müşterinin
 * serbest metin açıklaması (kişisel bilgi içerebilir) mesaja EKLENMEZ.
 */
export async function notifyReturnRequest(orderId: string, reason: string): Promise<void> {
  try {
    const summary = await loadOrderSummary(orderId);
    if (!summary) return;
    await sendTelegramMessage(
      `↩️ <b>İade / iptal talebi</b>\nSebep: ${escapeHtml(reason)}\n\n${orderLines(orderId, summary)}\n` +
        `<a href="${env.NEXT_PUBLIC_APP_URL}/admin/iadeler">Talepleri aç</a>`
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'telegram-notify' } });
  }
}
