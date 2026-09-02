import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env.mjs';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { formatPriceFromCents } from '@/lib/format';
import { LEGAL } from '@/lib/legal';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER = { name: LEGAL.markaAdi, email: LEGAL.eposta };
// Yönetici bildirimi: ayrı env verilmişse oraya, yoksa gönderen adresine.
const ADMIN_EMAIL = env.ORDER_NOTIFY_EMAIL || LEGAL.eposta;

async function sendBrevo(payload: Record<string, unknown>): Promise<void> {
  if (!env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY yok — e-posta atlanıyor');
    return;
  }
  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Brevo hata:', res.status, body.slice(0, 400));
      Sentry.captureMessage(`Brevo e-posta gönderilemedi: HTTP ${res.status}`, { level: 'error' });
    }
  } catch (err) {
    console.error('[email] Brevo istisna:', err instanceof Error ? err.message : err);
    Sentry.captureException(err);
  }
}

interface OrderRow {
  order_number: string;
  contact_email: string;
  contact_phone: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  payment_provider: string;
  shipping_address: { full_name: string; phone: string; city: string; district: string; address_line: string };
  order_items: { product_name_snapshot: string; variant_label_snapshot: string; unit_price_cents: number; quantity: number }[];
}

function itemsTable(items: OrderRow['order_items']): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escapeHtml(i.product_name_snapshot)} <span style="color:#888">(${escapeHtml(
          i.variant_label_snapshot
        )}) × ${i.quantity}</span></td><td style="padding:6px 0;text-align:right;white-space:nowrap">${formatPriceFromCents(
          i.unit_price_cents * i.quantity
        )}</td></tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Sipariş oluşturulunca müşteriye onay + yöneticiye bildirim e-postası gönderir.
 * Best-effort: BREVO_API_KEY yoksa veya gönderim başarısızsa sipariş akışı bozulmaz.
 */
export async function sendOrderPlacedEmail(orderId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('orders')
    .select(
      'order_number, contact_email, contact_phone, subtotal_cents, shipping_cents, total_cents, payment_provider, shipping_address, order_items(product_name_snapshot, variant_label_snapshot, unit_price_cents, quantity)'
    )
    .eq('id', orderId)
    .single();
  if (!data) return;
  const order = data as unknown as OrderRow;
  const isHavale = order.payment_provider === 'havale';

  // Havale ise banka bilgisi
  let bankBlock = '';
  if (isHavale) {
    const { data: s } = await supabase
      .from('site_settings')
      .select('bank_account_holder, bank_name, bank_iban, bank_note')
      .eq('id', true)
      .single();
    if (s?.bank_iban) {
      bankBlock = `
        <div style="background:#f4f1ea;border-radius:12px;padding:16px;margin:16px 0;font-size:14px">
          <b>🏦 Havale / EFT Bilgileri</b><br>
          Aşağıdaki hesaba <b>${escapeHtml(order.order_number)}</b> açıklamasıyla ödeme yapın.<br><br>
          ${s.bank_account_holder ? `Alıcı: <b>${escapeHtml(s.bank_account_holder)}</b><br>` : ''}
          ${s.bank_name ? `Banka: <b>${escapeHtml(s.bank_name)}</b><br>` : ''}
          IBAN: <b style="font-family:monospace">${escapeHtml(s.bank_iban)}</b><br>
          Açıklama: <b>${escapeHtml(order.order_number)}</b>
          ${s.bank_note ? `<br><span style="color:#888">${escapeHtml(s.bank_note)}</span>` : ''}
        </div>`;
    }
  }

  const totalsBlock = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;border-top:1px dashed #ccc;padding-top:8px">
      <tr><td style="color:#666;padding:3px 0">Ara Toplam</td><td style="text-align:right">${formatPriceFromCents(order.subtotal_cents)}</td></tr>
      <tr><td style="color:#666;padding:3px 0">Kargo</td><td style="text-align:right">${order.shipping_cents === 0 ? 'Bedava' : formatPriceFromCents(order.shipping_cents)}</td></tr>
      <tr><td style="font-weight:bold;padding-top:6px">Genel Toplam</td><td style="text-align:right;font-weight:bold;padding-top:6px">${formatPriceFromCents(order.total_cents)}</td></tr>
    </table>`;

  const addr = order.shipping_address;
  const addressBlock = `
    <p style="font-size:14px;line-height:1.6"><b>Teslimat Adresi</b><br>
    ${escapeHtml(addr.full_name)}<br>${escapeHtml(addr.phone)}<br>
    ${escapeHtml(addr.district)} / ${escapeHtml(addr.city)}<br>
    <span style="color:#666">${escapeHtml(addr.address_line)}</span></p>`;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <h2 style="color:#1b4332">Siparişiniz Alındı 🎉</h2>
      <p style="font-size:14px">Sipariş numaranız: <b>${escapeHtml(order.order_number)}</b></p>
      ${
        isHavale
          ? '<p style="font-size:14px">Ödemeniz (havale/EFT) hesabımıza geçtikten sonra siparişiniz hazırlanmaya başlar.</p>'
          : '<p style="font-size:14px">Ödemeniz onaylandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.</p>'
      }
      ${bankBlock}
      <h3 style="color:#1b4332;font-size:16px;margin-top:20px">Ürünler</h3>
      ${itemsTable(order.order_items)}
      ${totalsBlock}
      ${addressBlock}
      <p style="font-size:12px;color:#888;margin-top:24px">
        Sorularınız için: ${LEGAL.telefon} · ${LEGAL.eposta}<br>
        ${LEGAL.markaAdi} — ${LEGAL.adres}
      </p>
    </div>`;

  await sendBrevo({
    sender: SENDER,
    to: [{ email: order.contact_email }],
    subject: `${LEGAL.markaAdi} — Siparişiniz alındı (${order.order_number})`,
    htmlContent: customerHtml,
    replyTo: { email: LEGAL.eposta, name: LEGAL.markaAdi }
  });

  // Yönetici bildirimi (kısa)
  await sendBrevo({
    sender: SENDER,
    to: [{ email: ADMIN_EMAIL }],
    subject: `🛒 Yeni sipariş: ${order.order_number}${isHavale ? ' (HAVALE — ödeme bekleniyor)' : ''}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;font-size:14px">
        <p><b>${order.order_number}</b> — ${formatPriceFromCents(order.total_cents)} — ${isHavale ? 'Havale (pending)' : 'Kart (ödendi)'}</p>
        <p>${escapeHtml(addr.full_name)} · ${escapeHtml(order.contact_phone)} · ${escapeHtml(order.contact_email)}<br>
        ${escapeHtml(addr.district)}/${escapeHtml(addr.city)} — ${escapeHtml(addr.address_line)}</p>
        ${itemsTable(order.order_items)}
        <p><a href="${env.NEXT_PUBLIC_APP_URL}/admin/siparisler">Yönetim paneli</a></p>
      </div>`
  });
}
