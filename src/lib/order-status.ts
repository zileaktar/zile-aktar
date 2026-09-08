import type { OrderStatus } from '@/lib/supabase/types';

/**
 * Müşteriye dönük sipariş durumu etiketleri + rozet stili.
 * Hem "Siparişlerim" listesi hem sipariş detay sayfası buradan okur.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Beklemede', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Ödendi', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Başarısız', className: 'bg-red-100 text-red-700' },
  shipped: { label: 'Kargoya Verildi', className: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Teslim Edildi', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal Edildi', className: 'bg-carbon/10 text-carbon/60' },
  refunded: { label: 'İade Edildi', className: 'bg-carbon/10 text-carbon/60' }
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? ORDER_STATUS_LABELS.pending;
}

const PAYMENT_LABELS: Record<string, string> = {
  iyzico: 'Kredi / Banka Kartı',
  havale: 'Havale / EFT'
};

export function paymentMethodLabel(provider: string) {
  return PAYMENT_LABELS[provider] ?? provider;
}
