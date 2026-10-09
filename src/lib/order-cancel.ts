import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { cancelOrRefundTransaction, getVposTransaction } from '@/lib/vakifbank';
import { confirmVakifbankPayment } from '@/lib/payments';
import { sendOrderCancelledEmail } from '@/lib/email';
import { CARD_REFUND_VIA_BANK_API } from '@/lib/refund-config';
import { redactPII, redactPIIString } from '@/lib/mask';
import type { OrderStatus } from '@/lib/supabase/types';

export type CancelOrderResult = { ok: boolean; message: string };

/** Sipariş hangi yolla kapatılabilir (panelde doğru düğme/metin göstermek için). */
export type CancelKind = 'cancel_unpaid' | 'refund_card' | 'refund_transfer' | 'closed';

const OPEN_PAID: ReadonlyArray<OrderStatus> = ['paid', 'shipped', 'delivered'];

export function cancelKindFor(status: OrderStatus, paymentProvider: string): CancelKind {
  if (status === 'pending') return 'cancel_unpaid';
  if (OPEN_PAID.includes(status)) return paymentProvider === 'vakifbank' ? 'refund_card' : 'refund_transfer';
  return 'closed';
}

/** 12345 kuruş → "123.45" (VakıfBank tutar biçimi). */
function centsToAmount(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function logError(context: string, err: unknown) {
  console.error(`[order-cancel] ${context}:`, err instanceof Error ? redactPIIString(err.message) : redactPII(err));
  Sentry.captureException(err, { tags: { context: 'order-cancel' } });
}

/**
 * Yönetim panelinden sipariş iptali / iadesi. Çağıran taraf admin + AAL2
 * kontrolünü ÖNCEDEN yapmış olmalıdır (bkz. admin/siparisler/[id]/cancel-actions.ts).
 *
 *  - Ödenmemiş (pending) sipariş: kartlıysa önce bankaya sorulur (müşteri tam
 *    o sırada ödemiş olabilir); ödeme yoksa sipariş 'cancelled' yapılır, stok
 *    geri eklenir.
 *  - Kartla ödenmiş: VakıfBank'ta önce İPTAL (gün sonu kapanmadıysa, tam tutar)
 *    denenir; banka kabul etmezse tam tutarlı İADE yapılır. Banka onaylarsa
 *    sipariş 'refunded' olur. Çift istek `refund_started_at` kilidiyle engellenir.
 *  - Havale ile ödenmiş: para bankadan otomatik dönmez — admin parayı kendisi
 *    geri gönderdiğini onaylar, sipariş 'refunded' olarak kapatılır.
 */
export async function cancelOrRefundOrder(params: {
  orderId: string;
  restock: boolean;
  clientIp: string;
}): Promise<CancelOrderResult> {
  const { orderId, clientIp } = params;
  const serviceClient = createSupabaseServiceRoleClient();

  const { data: order } = await serviceClient
    .from('orders')
    .select('order_number, status, payment_provider, total_cents, payment_conversation_id, refund_started_at')
    .eq('id', orderId)
    .single();
  if (!order) return { ok: false, message: 'Sipariş bulunamadı.' };

  const kind = cancelKindFor(order.status, order.payment_provider);
  if (kind === 'closed') return { ok: false, message: 'Bu sipariş zaten kapalı (iptal / iade / başarısız).' };

  const close = async (status: 'cancelled' | 'refunded', restock: boolean, refundRef: string | null) => {
    const { data, error } = await serviceClient.rpc('close_order_with_restock', {
      p_order_id: orderId,
      p_new_status: status,
      p_restock: restock,
      p_refund_ref: refundRef
    });
    if (error) throw error;
    return data === true;
  };

  // --- Ödenmemiş sipariş
  if (kind === 'cancel_unpaid') {
    if (order.payment_provider === 'vakifbank') {
      const check = await confirmVakifbankPayment(orderId);
      if (check.status === 'paid') {
        return {
          ok: false,
          message:
            'Bu siparişin ödemesi bankada tamamlanmış; sipariş "Ödendi" olarak güncellendi. Ücreti iade etmek için sayfayı yenileyip tekrar deneyin.'
        };
      }
      if (check.status === 'failed') {
        return { ok: true, message: 'Bu siparişin ödemesi gerçekleşmemiş; sipariş kapatıldı ve stok geri eklendi.' };
      }
      if (check.reason === 'retrieve_failed') {
        return { ok: false, message: 'Bankaya ulaşılamadı. Birkaç dakika sonra tekrar deneyin.' };
      }
      // not_final / missing_conversation_id: müşteri ödeme yapmamış → iptal edilebilir.
    }
    try {
      // Ödenmemiş siparişte ayrılmış stok HER ZAMAN geri eklenir.
      const closed = await close('cancelled', true, null);
      if (!closed) return { ok: false, message: 'Sipariş durumu bu arada değişmiş. Sayfayı yenileyip kontrol edin.' };
    } catch (err) {
      logError('iptal (ödenmemiş)', err);
      return { ok: false, message: 'Sipariş iptal edilemedi. Lütfen tekrar deneyin.' };
    }
    await sendOrderCancelledEmail(orderId, 'cancelled');
    return { ok: true, message: 'Sipariş iptal edildi, stok geri eklendi ve müşteriye e-posta gönderildi.' };
  }

  // --- Havale ile ödenmiş: para elle geri gönderilir
  if (kind === 'refund_transfer') {
    try {
      const closed = await close('refunded', params.restock, null);
      if (!closed) return { ok: false, message: 'Sipariş durumu bu arada değişmiş. Sayfayı yenileyip kontrol edin.' };
    } catch (err) {
      logError('iade (havale)', err);
      return { ok: false, message: 'Sipariş güncellenemedi. Lütfen tekrar deneyin.' };
    }
    await sendOrderCancelledEmail(orderId, 'refunded_transfer');
    return { ok: true, message: 'Sipariş "İade Edildi" olarak kapatıldı ve müşteriye e-posta gönderildi.' };
  }

  // --- Kartla ödenmiş, iade VakıfBank PANELİNDEN yapıldı (bkz. refund-config.ts):
  // banka API'sine gidilmez, sipariş yalnızca kapatılır.
  if (!CARD_REFUND_VIA_BANK_API) {
    try {
      const closed = await close('refunded', params.restock, 'vakifbank-panel');
      if (!closed) return { ok: false, message: 'Sipariş durumu bu arada değişmiş. Sayfayı yenileyip kontrol edin.' };
    } catch (err) {
      logError('iade (kart, panelden)', err);
      return { ok: false, message: 'Sipariş güncellenemedi. Lütfen tekrar deneyin.' };
    }
    await sendOrderCancelledEmail(orderId, 'refunded_card');
    return { ok: true, message: 'Sipariş "İade Edildi" olarak kapatıldı ve müşteriye e-posta gönderildi.' };
  }

  // --- Kartla ödenmiş: VakıfBank iptal / iade (API — sabit IP gerektirir)
  // Kilit: yalnızca bir istek bankaya gidebilir.
  const { data: claimed } = await serviceClient
    .from('orders')
    .update({ refund_started_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('refund_started_at', null)
    .in('status', OPEN_PAID as OrderStatus[])
    .select('id');
  if (!claimed || claimed.length === 0) {
    return {
      ok: false,
      message: 'Bu sipariş için bir iade işlemi zaten başlatılmış. Birkaç saniye bekleyip sayfayı yenileyin.'
    };
  }
  const releaseLock = async () => {
    await serviceClient.from('orders').update({ refund_started_at: null }).eq('id', orderId);
  };

  // Asıl satış işleminin banka numarası (TransactionId) — bankadan GÜNCEL sorgulanır.
  let transactionId: string | undefined;
  try {
    if (!order.payment_conversation_id) throw new Error('PaymentToken kayıtlı değil');
    const tx = await getVposTransaction(order.payment_conversation_id);
    const paidCents = Math.round(Number(tx.Amount ?? 0) * 100);
    if (tx.Rc !== '0000' || tx.AuthResultCode !== '0000' || !tx.TransactionId || paidCents !== order.total_cents) {
      await releaseLock();
      return {
        ok: false,
        message: 'Bankada bu siparişe ait başarılı bir ödeme bulunamadı ya da tutar eşleşmedi. VakıfBank panelinden kontrol edin.'
      };
    }
    transactionId = tx.TransactionId;
  } catch (err) {
    logError('banka sorgusu', err);
    await releaseLock();
    return { ok: false, message: 'Bankaya ulaşılamadı. Birkaç dakika sonra tekrar deneyin.' };
  }

  // Önce İPTAL (gün sonu kapanmadıysa); olmazsa tam tutarlı İADE.
  let refundRef: string | null = null;
  let bankMessage = '';
  try {
    const cancel = await cancelOrRefundTransaction({ type: 'Cancel', referenceTransactionId: transactionId, clientIp });
    if (cancel.resultCode === '0000') {
      refundRef = cancel.raw.match(/<TransactionId>([^<]*)<\/TransactionId>/)?.[1] ?? 'iptal';
    } else {
      const refund = await cancelOrRefundTransaction({
        type: 'Refund',
        referenceTransactionId: transactionId,
        amount: centsToAmount(order.total_cents),
        clientIp
      });
      if (refund.resultCode === '0000') {
        refundRef = refund.raw.match(/<TransactionId>([^<]*)<\/TransactionId>/)?.[1] ?? 'iade';
      } else {
        bankMessage = `${refund.resultCode ?? '?'} — ${refund.resultDetail ?? cancel.resultDetail ?? 'bilinmeyen hata'}`;
      }
    }
  } catch (err) {
    logError('banka iptal/iade', err);
    // Ağ hatası: banka işlemi yapmış OLABİLİR — kilit bırakılmaz, elle kontrol gerekir.
    Sentry.captureMessage(`İade sonucu belirsiz: sipariş ${order.order_number}`, { level: 'fatal' });
    return {
      ok: false,
      message:
        'Bankadan yanıt alınamadı; iade yapılmış olabilir. Tekrar denemeden önce VakıfBank panelinden bu işlemi kontrol edin ve bize bildirin.'
    };
  }

  if (!refundRef) {
    await releaseLock();
    Sentry.captureMessage(`VakıfBank iade reddedildi: ${bankMessage}`, { level: 'error' });
    return { ok: false, message: `Banka iadeyi kabul etmedi (${bankMessage}). Sipariş değiştirilmedi.` };
  }

  try {
    const closed = await close('refunded', params.restock, refundRef);
    if (!closed) throw new Error('close_order_with_restock false döndü');
  } catch (err) {
    logError('iade sonrası sipariş güncelleme', err);
    Sentry.captureMessage(`Banka iade etti ama sipariş güncellenemedi: ${order.order_number}`, { level: 'fatal' });
    return {
      ok: false,
      message: 'Banka iadeyi YAPTI ama sipariş durumu güncellenemedi. Tekrar iade etmeyin; durumu bize bildirin.'
    };
  }

  await sendOrderCancelledEmail(orderId, 'refunded_card');
  return {
    ok: true,
    message: 'Ödeme müşterinin kartına iade edildi, sipariş "İade Edildi" olarak kapatıldı ve müşteriye e-posta gönderildi.'
  };
}
