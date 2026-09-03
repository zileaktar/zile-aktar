'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cart-store';
import { formatPriceFromCents } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD_CENTS, calculateShippingCents, lineDealDiscountCents } from '@/lib/pricing';
import { trackBeginCheckout } from '@/lib/analytics';
import { checkoutRequestSchema } from '@/lib/validations/checkout';
import { isValidTcKimlikNo } from '@/lib/tc-kimlik-no';
import { HealthDisclaimer } from '@/components/product/HealthDisclaimer';
import type { CheckoutPrefill } from '@/lib/data/account';

export function CheckoutForm({ prefill }: { prefill: CheckoutPrefill | null }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const dealDiscount = items.reduce((sum, i) => sum + lineDealDiscountCents(i.priceCents, i.quantity, i.deal), 0);
  const baseShipping = calculateShippingCents(subtotal);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
    freeShipping: boolean;
    message: string;
  } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Sepet tutarı değişirse uygulanan kupon geçersiz olabilir — sıfırla, kullanıcı tekrar uygular.
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, [subtotal]);

  // Ödeme sayfasına gelindi (analytics) — sepet doluysa bir kez.
  const beganCheckout = useRef(false);
  useEffect(() => {
    if (beganCheckout.current || subtotal <= 0) return;
    beganCheckout.current = true;
    trackBeginCheckout(subtotal / 100);
  }, [subtotal]);

  const rawCouponDiscount = appliedCoupon?.discountCents ?? 0;
  // Sunucu (create_order) ile aynı sınır: kampanya + kupon toplamı ara toplamı geçemez.
  const discount = Math.min(rawCouponDiscount, Math.max(0, subtotal - dealDiscount));
  const shipping = appliedCoupon?.freeShipping ? 0 : baseShipping;
  const total = subtotal - dealDiscount - discount + shipping;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code || couponChecking) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.message ?? 'Kod uygulanamadı.');
      } else {
        setAppliedCoupon({
          code: data.code,
          discountCents: data.discountCents,
          freeShipping: data.freeShipping,
          message: data.message
        });
      }
    } catch {
      setCouponError('Kod kontrol edilemedi, tekrar deneyin.');
    } finally {
      setCouponChecking(false);
    }
  }

  const [form, setForm] = useState({
    fullName: prefill?.fullName ?? '',
    phone: prefill?.phone ?? '',
    email: prefill?.email ?? '',
    city: prefill?.city ?? '',
    district: prefill?.district ?? '',
    addressLine: prefill?.addressLine ?? '',
    identityNumber: ''
  });
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billing, setBilling] = useState({ fullName: '', phone: '', city: '', district: '', addressLine: '' });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'havale'>('card');
  const [acceptedDistanceSalesAgreement, setAcceptedDistanceSalesAgreement] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const identityInvalid = form.identityNumber.length === 11 && !isValidTcKimlikNo(form.identityNumber);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🛍️</div>
        <p className="font-semibold text-lg text-primary mb-2">Sepetiniz boş</p>
        <button onClick={() => router.push('/')} className="mt-4 bg-primary text-white font-bold px-6 py-3 rounded-full">
          Alışverişe Başla
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const payload = {
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      address: form,
      billingAddress: billingDifferent ? billing : null,
      paymentMethod,
      couponCode: appliedCoupon?.code,
      acceptedDistanceSalesAgreement,
      acceptedKvkk
    };

    const parsed = checkoutRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors([data.error ?? 'Sipariş oluşturulamadı.']);
        setSubmitting(false);
        return;
      }

      // Sepet BURADA temizlenmez — ödeme yarıda kalırsa kullanıcı geri dönüp
      // tekrar deneyebilsin. Sepet yalnızca sipariş onay sayfasında (/siparis-alindi)
      // temizlenir (bkz. ClearCartOnSuccess).
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        setErrors(['Ödeme başlatılamadı. Lütfen tekrar deneyin.']);
        setSubmitting(false);
      }
    } catch {
      setErrors(['Sunucuya bağlanılamadı. Lütfen tekrar deneyin.']);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-xl text-primary mb-6">Güvenli Ödeme</h1>

      {prefill && (
        <p className="text-xs text-carbon/50 mb-4">Bilgileriniz hesabınızdan otomatik dolduruldu — gerekirse düzenleyebilirsiniz.</p>
      )}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm space-y-1">
          {errors.map((err, idx) => (
            <div key={idx}>⚠️ {err}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-display font-bold text-primary flex items-center gap-2">📍 Adres ve Teslimat Bilgileri</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Ad Soyad" className="chk-input sm:col-span-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input required type="tel" placeholder="Telefon (05xx xxx xx xx)" className="chk-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input required type="email" placeholder="E-posta" className="chk-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input required placeholder="İl" className="chk-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input required placeholder="İlçe" className="chk-input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              <textarea
                required
                placeholder="Açık Adres (Mahalle, Sokak, No, Daire)"
                rows={2}
                className="chk-input sm:col-span-2"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-carbon/70 cursor-pointer pt-1">
              <input
                type="checkbox"
                className="accent-primary w-4 h-4 shrink-0"
                checked={billingDifferent}
                onChange={(e) => setBillingDifferent(e.target.checked)}
              />
              Fatura adresim teslimat adresimden farklı
            </label>

            {billingDifferent && (
              <div className="grid sm:grid-cols-2 gap-3 pt-1 border-t border-dashed border-primary/15">
                <p className="sm:col-span-2 text-xs font-semibold text-carbon/60 pt-2">Fatura Adresi</p>
                <input required placeholder="Ad Soyad / Firma Unvanı" className="chk-input sm:col-span-2" value={billing.fullName} onChange={(e) => setBilling({ ...billing, fullName: e.target.value })} />
                <input required type="tel" placeholder="Telefon" className="chk-input" value={billing.phone} onChange={(e) => setBilling({ ...billing, phone: e.target.value })} />
                <input required placeholder="İl" className="chk-input" value={billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} />
                <input required placeholder="İlçe" className="chk-input" value={billing.district} onChange={(e) => setBilling({ ...billing, district: e.target.value })} />
                <textarea required placeholder="Fatura Açık Adresi" rows={2} className="chk-input sm:col-span-2" value={billing.addressLine} onChange={(e) => setBilling({ ...billing, addressLine: e.target.value })} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-display font-bold text-primary flex items-center gap-2">💳 Ödeme Yöntemi</h4>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-start gap-2.5 border-2 rounded-xl p-3.5 text-left transition ${
                  paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'
                }`}
              >
                <span className="text-lg leading-none">💳</span>
                <span className="text-sm font-semibold">
                  Kredi / Banka Kartı
                  <span className="block text-[11px] font-normal text-carbon/50">3D Secure · iyzico</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('havale')}
                className={`flex items-start gap-2.5 border-2 rounded-xl p-3.5 text-left transition ${
                  paymentMethod === 'havale' ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'
                }`}
              >
                <span className="text-lg leading-none">🏦</span>
                <span className="text-sm font-semibold">
                  Havale / EFT
                  <span className="block text-[11px] font-normal text-carbon/50">Banka hesabına ödeme</span>
                </span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <>
                <div>
                  <input
                    required
                    maxLength={11}
                    inputMode="numeric"
                    placeholder="T.C. Kimlik No"
                    className={`chk-input w-full ${identityInvalid ? 'ring-2 ring-red-300' : ''}`}
                    value={form.identityNumber}
                    onChange={(e) => setForm({ ...form, identityNumber: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  />
                  {identityInvalid && <p className="text-[11px] text-red-500 mt-1">Geçerli bir T.C. Kimlik No girin.</p>}
                  <p className="text-[11px] text-carbon/45 mt-1">
                    iyzico&apos;nun 3D Secure altyapısı, kart sahibi doğrulaması için T.C. Kimlik No zorunlu tutar.
                  </p>
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-xs text-primary-dark flex items-start gap-2">
                  <span className="text-base leading-none">🔒</span>
                  <span>
                    &quot;Ödemeyi Tamamla&quot; dedikten sonra kart bilgilerinizi iyzico&apos;nun PCI-DSS uyumlu güvenli
                    sayfasında girersiniz. Kart bilgileriniz bize hiçbir zaman ulaşmaz.
                  </span>
                </div>
              </>
            )}

            {paymentMethod === 'havale' && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-xs text-primary-dark flex items-start gap-2">
                <span className="text-base leading-none">🏦</span>
                <span>
                  Siparişi tamamlayınca banka hesap bilgilerimiz (IBAN) ekranda gösterilir. Havale/EFT açıklamasına
                  <b> sipariş numaranızı</b> yazın. Ödemeniz onaylandığında siparişiniz hazırlanmaya başlar.
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <label className="flex items-start gap-3 text-xs sm:text-sm text-carbon/70 cursor-pointer">
              <input required type="checkbox" className="mt-0.5 accent-primary w-4 h-4 shrink-0" checked={acceptedDistanceSalesAgreement} onChange={(e) => setAcceptedDistanceSalesAgreement(e.target.checked)} />
              <span>
                <a href="/on-bilgilendirme-formu" target="_blank" className="text-primary underline">Ön Bilgilendirme Formu</a>&apos;nu ve{' '}
                <a href="/mesafeli-satis-sozlesmesi" target="_blank" className="text-primary underline">Mesafeli Satış Sözleşmesi</a>&apos;ni
                okudum, kabul ediyorum.
              </span>
            </label>
            <label className="flex items-start gap-3 text-xs sm:text-sm text-carbon/70 cursor-pointer">
              <input required type="checkbox" className="mt-0.5 accent-primary w-4 h-4 shrink-0" checked={acceptedKvkk} onChange={(e) => setAcceptedKvkk(e.target.checked)} />
              <span>
                <a href="/kvkk" target="_blank" className="text-primary underline">KVKK Aydınlatma Metni</a> kapsamında kişisel verilerimin işlenmesini kabul ediyorum.
              </span>
            </label>
            <HealthDisclaimer compact />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm lg:sticky lg:top-24 space-y-4">
            <h4 className="font-display font-bold text-primary">Sipariş Özeti</h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3">
                  <Image src={item.imageUrl} width={48} height={48} className="w-12 h-12 rounded-lg object-cover bg-cream shrink-0" alt={item.productName} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{item.productName}</div>
                    <div className="text-[11px] text-carbon/45">
                      {item.variantLabel} × {item.quantity}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{formatPriceFromCents(item.priceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-primary/15 pt-3">
              <label className="text-xs font-semibold text-carbon/60 mb-1.5 block">İndirim Kodu</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
                  <span className="font-semibold text-primary">
                    {appliedCoupon.code}
                    {appliedCoupon.freeShipping && <span className="ml-1 font-normal text-carbon/60">· ücretsiz kargo</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput('');
                    }}
                    className="text-xs text-red-500 hover:underline shrink-0"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder="Kodu girin"
                    maxLength={40}
                    className="chk-input flex-1 uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponChecking || !couponInput.trim()}
                    className="shrink-0 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold text-sm px-4 rounded-xl transition"
                  >
                    {couponChecking ? '...' : 'Uygula'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="border-t border-dashed border-primary/15 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-carbon/60">
                <span>Ara Toplam</span>
                <span>{formatPriceFromCents(subtotal)}</span>
              </div>
              {dealDiscount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Kampanya indirimi</span>
                  <span>-{formatPriceFromCents(dealDiscount)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>İndirim ({appliedCoupon?.code})</span>
                  <span>-{formatPriceFromCents(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-carbon/60">
                <span>Kargo</span>
                <span>{shipping === 0 ? 'Bedava' : formatPriceFromCents(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-[11px] text-accent-dark">{formatPriceFromCents(FREE_SHIPPING_THRESHOLD_CENTS - subtotal)} daha ekleyin, kargo bedava olsun!</p>
              )}
              <div className="flex justify-between font-display font-bold text-lg text-primary pt-2 border-t border-dashed border-primary/15">
                <span>Genel Toplam</span>
                <span>{formatPriceFromCents(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="touch-target w-full bg-accent hover:bg-accent-dark disabled:opacity-60 text-primary-dark font-bold py-3.5 rounded-full transition flex items-center justify-center gap-2"
            >
              {submitting
                ? 'İşleniyor...'
                : paymentMethod === 'havale'
                  ? '🏦 Siparişi Tamamla'
                  : '🔒 Güvenle Ödemeyi Tamamla'}
            </button>
            <p className="text-[11px] text-center text-carbon/40">
              {paymentMethod === 'havale'
                ? 'Sipariş oluşturulur, banka bilgileri ekranda gösterilir.'
                : 'Ödemeniz iyzico altyapısı ile 3D Secure korumalı olarak işlenir.'}
            </p>
          </div>
        </div>
      </form>

      <style jsx global>{`
        .chk-input {
          background: #f4f1ea;
          border: 1px solid rgba(27, 67, 50, 0.15);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }
        .chk-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(212, 163, 115, 0.5);
        }
      `}</style>
    </div>
  );
}
