'use client';

import { useState, useTransition } from 'react';
import { startMfaEnrollmentAction, verifyMfaCodeAction } from './actions';

interface Enrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

/** Supabase qr_code'u data URI olarak verir; ham SVG gelirse de img'de gösterilebilsin. */
function toImageSrc(qr: string): string {
  return qr.startsWith('data:') ? qr : `data:image/svg+xml;utf8,${encodeURIComponent(qr)}`;
}

export function MfaForm({ verifiedFactorId }: { verifiedFactorId: string | null }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const factorId = verifiedFactorId ?? enrollment?.factorId ?? null;

  function startEnrollment() {
    setError(null);
    startTransition(async () => {
      const res = await startMfaEnrollmentAction();
      if ('error' in res) setError(res.error);
      else setEnrollment(res);
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    startTransition(async () => {
      const res = await verifyMfaCodeAction(factorId, code);
      if (res.error) {
        setError(res.error);
        setCode('');
        return;
      }
      // Tam sayfa yükleme: yeni (AAL2) oturum çerezleriyle admin layout'u
      // sıfırdan çalışsın (yumuşak gezinmede ortak layout yeniden çalışmaz).
      window.location.assign('/admin');
    });
  }

  const codeForm = (
    <form onSubmit={verify} className="space-y-3">
      <label htmlFor="mfa-code" className="block text-xs font-semibold text-carbon/60">
        Doğrulama uygulamasındaki 6 haneli kod
      </label>
      <input
        id="mfa-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-semibold"
        placeholder="••••••"
      />
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-3 rounded-full"
      >
        {pending ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
      </button>
    </form>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h1 className="font-display font-bold text-xl text-primary">İki Adımlı Doğrulama</h1>
        <p className="text-sm text-carbon/60 mt-1">
          Yönetim paneline girmek için şifrenize ek olarak telefonunuzdaki doğrulama uygulamasından bir kod gerekir.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {verifiedFactorId && codeForm}

      {!verifiedFactorId && !enrollment && (
        <div className="space-y-3 text-sm text-carbon/70">
          <p>
            Bu hesapta henüz iki adımlı doğrulama kurulu değil. Telefonunuza <b>Google Authenticator</b> veya{' '}
            <b>Microsoft Authenticator</b> uygulamasını kurun, sonra aşağıdaki butona basın.
          </p>
          <button
            type="button"
            onClick={startEnrollment}
            disabled={pending}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-3 rounded-full"
          >
            {pending ? 'Hazırlanıyor...' : 'Kurulumu Başlat'}
          </button>
        </div>
      )}

      {!verifiedFactorId && enrollment && (
        <div className="space-y-4">
          <ol className="text-sm text-carbon/70 list-decimal pl-5 space-y-1">
            <li>Doğrulama uygulamasında &quot;+&quot; → &quot;QR kodu tara&quot; seçin.</li>
            <li>Aşağıdaki kodu okutun.</li>
            <li>Uygulamanın gösterdiği 6 haneli kodu girin.</li>
          </ol>
          <div className="flex justify-center bg-white border border-primary/10 rounded-xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI QR kodu, optimize edilecek bir görsel değil */}
            <img src={toImageSrc(enrollment.qrCode)} alt="İki adımlı doğrulama QR kodu" className="w-48 h-48" />
          </div>
          <details className="text-xs text-carbon/60">
            <summary className="cursor-pointer">QR okutamıyorum — kodu elle gir</summary>
            <p className="mt-2 font-mono break-all bg-cream rounded-lg p-2 select-all">{enrollment.secret}</p>
          </details>
          {codeForm}
        </div>
      )}
    </div>
  );
}
