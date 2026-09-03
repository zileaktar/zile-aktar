import { getSiteSettings } from '@/lib/data/settings';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { ClearCartOnSuccess } from '@/components/cart/ClearCartOnSuccess';
import { PurchaseTracking } from '@/components/analytics/PurchaseTracking';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ order?: string; odeme?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order, odeme } = await searchParams;
  const isHavale = odeme === 'havale';
  const { bank } = isHavale ? await getSiteSettings() : { bank: null };

  // Analytics "purchase" olayı için sipariş tutarını sunucudan al.
  let orderTotalTl = 0;
  if (order) {
    const { data } = await createSupabaseServiceRoleClient()
      .from('orders')
      .select('total_cents')
      .eq('order_number', order)
      .maybeSingle();
    if (data) orderTotalTl = data.total_cents / 100;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <ClearCartOnSuccess />
      {order && orderTotalTl > 0 && <PurchaseTracking orderNumber={order} valueTl={orderTotalTl} />}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
      <h1 className="font-display font-bold text-xl text-primary mb-2">Siparişiniz Alındı!</h1>
      <p className="text-sm text-carbon/60 mb-6">
        Sipariş numaranız <b className="text-primary">{order ?? '—'}</b>.
        {!isHavale && ' Onay e-postası kısa süre içinde gönderilecektir.'}
      </p>

      {isHavale && (
        <div className="bg-white rounded-2xl p-5 shadow-sm text-left text-sm mb-6 space-y-3">
          <p className="font-display font-bold text-primary text-center">🏦 Havale / EFT Bilgileri</p>
          <p className="text-xs text-carbon/60">
            Aşağıdaki hesaba <b>{order}</b> açıklamasıyla ödeme yapın. Ödemeniz onaylandığında siparişiniz hazırlanmaya
            başlar. Onaya kadar ürünler sizin için ayrılır.
          </p>
          {bank?.iban ? (
            <dl className="bg-cream rounded-xl p-4 space-y-2">
              {bank.accountHolder && (
                <div className="flex justify-between gap-3">
                  <dt className="text-carbon/50">Alıcı</dt>
                  <dd className="font-semibold text-right">{bank.accountHolder}</dd>
                </div>
              )}
              {bank.bankName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-carbon/50">Banka</dt>
                  <dd className="font-semibold text-right">{bank.bankName}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-carbon/50">IBAN</dt>
                <dd className="font-mono font-semibold text-right break-all">{bank.iban}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-1 border-t border-dashed border-primary/15">
                <dt className="text-carbon/50">Açıklama</dt>
                <dd className="font-semibold text-right">{order}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-red-500">
              Banka bilgileri henüz tanımlanmamış. Lütfen sipariş numaranızla bizimle iletişime geçin.
            </p>
          )}
          {bank?.note && <p className="text-[11px] text-carbon/50">{bank.note}</p>}
        </div>
      )}

      <a href="/" className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition">
        Alışverişe Devam Et
      </a>
    </div>
  );
}
