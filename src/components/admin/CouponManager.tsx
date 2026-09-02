'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { formatPriceFromCents } from '@/lib/format';
import {
  createCouponAction,
  toggleCouponAction,
  deleteCouponAction,
  type CouponActionState
} from '@/app/admin/kuponlar/actions';
import type { CouponRow } from '@/lib/supabase/types';

const TYPE_LABELS: Record<CouponRow['type'], string> = {
  percent: 'Yüzde indirim',
  fixed: 'Sabit TL indirim',
  free_shipping: 'Ücretsiz kargo'
};

function couponValueLabel(c: CouponRow): string {
  if (c.type === 'percent') return `%${c.value}`;
  if (c.type === 'fixed') return formatPriceFromCents(c.value);
  return 'Kargo bedava';
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition"
    >
      {pending ? 'Ekleniyor...' : 'Kuponu Ekle'}
    </button>
  );
}

function CreateCouponForm() {
  const router = useRouter();
  const [state, formAction] = useFormState<CouponActionState, FormData>(createCouponAction, { error: null });
  const [type, setType] = useState<CouponRow['type']>('percent');
  const formRef = useRef<HTMLFormElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (state.ok) {
      formRef.current?.reset();
      setType('percent');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <h2 className="font-display font-bold text-primary">Yeni İndirim Kodu</h2>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Kod</label>
          <input
            name="code"
            required
            maxLength={40}
            placeholder="ör. HOSGELDIN10"
            onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            className="w-full bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm font-mono uppercase"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Tür</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as CouponRow['type'])}
            className="w-full bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
          >
            <option value="percent">Yüzde indirim (%)</option>
            <option value="fixed">Sabit TL indirim</option>
            <option value="free_shipping">Ücretsiz kargo</option>
          </select>
        </div>
      </div>

      {type !== 'free_shipping' && (
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">
            {type === 'percent' ? 'İndirim oranı (1–100)' : 'İndirim tutarı (TL)'}
          </label>
          <input
            name="valueRaw"
            required
            inputMode="decimal"
            placeholder={type === 'percent' ? '10' : '50'}
            className="w-full sm:w-40 bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Min. sepet (TL, ops.)</label>
          <input
            name="minCartTl"
            inputMode="decimal"
            placeholder="0"
            className="w-full bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Toplam kullanım (ops.)</label>
          <input
            name="maxUses"
            inputMode="numeric"
            placeholder="sınırsız"
            className="w-full bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Son kullanma (ops.)</label>
          <input type="date" name="expiresAt" className="w-full bg-cream border border-primary/15 rounded-xl px-3 py-2 text-sm text-carbon/70" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" name="perUserOnce" className="accent-primary w-4 h-4" />
        Müşteri başına yalnızca 1 kez kullanılabilsin
      </label>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs text-green-700">Kupon eklendi.</p>}

      <AddButton />
    </form>
  );
}

function CouponRowItem({ coupon }: { coupon: CouponRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<CouponActionState>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const expired = coupon.expires_at != null && new Date(coupon.expires_at) < new Date();
  const exhausted = coupon.max_uses != null && coupon.used_count >= coupon.max_uses;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${coupon.is_active && !expired && !exhausted ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono font-bold text-primary">{coupon.code}</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cream text-carbon/60">
            {TYPE_LABELS[coupon.type]}: {couponValueLabel(coupon)}
          </span>
          {!coupon.is_active && <span className="ml-2 text-xs text-amber-700 font-semibold">pasif</span>}
          {expired && <span className="ml-2 text-xs text-red-600 font-semibold">süresi dolmuş</span>}
          {exhausted && <span className="ml-2 text-xs text-red-600 font-semibold">limit doldu</span>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => toggleCouponAction(coupon.id))}
            className={`font-semibold ${coupon.is_active ? 'text-amber-700' : 'text-green-700'} hover:underline disabled:opacity-50`}
          >
            {coupon.is_active ? 'Pasife al' : 'Aktif et'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`"${coupon.code}" kodunu silmek istiyor musunuz?`)) run(() => deleteCouponAction(coupon.id));
            }}
            className="text-red-500 hover:underline disabled:opacity-50"
          >
            Sil
          </button>
        </div>
      </div>
      <p className="text-[11px] text-carbon/50 mt-2">
        Kullanım: {coupon.used_count}
        {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' (sınırsız)'}
        {coupon.min_cart_cents > 0 && ` · Min. sepet: ${formatPriceFromCents(coupon.min_cart_cents)}`}
        {coupon.per_user_once && ' · Müşteri başına 1 kez'}
        {coupon.expires_at && ` · Bitiş: ${new Date(coupon.expires_at).toLocaleDateString('tr-TR')}`}
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  return (
    <div className="space-y-6">
      <CreateCouponForm />
      <div>
        <h2 className="font-display font-bold text-primary mb-3">Tanımlı Kodlar ({coupons.length})</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-carbon/50">Henüz indirim kodu yok.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <CouponRowItem key={c.id} coupon={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
