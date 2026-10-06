'use client';

import { useState, useTransition } from 'react';
import { testVakifbankConnectionAction, type VakifbankTestResult } from '@/app/admin/ayarlar/actions';

/**
 * Ayarlar sayfasında: VakıfBank canlı bağlantı testi. Bankada 1 TL'lik bir ödeme
 * oturumu açmayı dener (para çekilmez) ve bankanın yanıtını + Vercel'deki
 * bilgilerin BİÇİMİNİ gösterir (değerler/şifre gösterilmez).
 */
export function VakifbankTestCard() {
  const [result, setResult] = useState<VakifbankTestResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setResult(null);
    startTransition(async () => {
      setResult(await testVakifbankConnectionAction());
    });
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div>
        <h2 className="font-semibold text-primary">VakıfBank Kartla Ödeme — Bağlantı Testi</h2>
        <p className="text-xs text-carbon/60 mt-1">
          Bankaya 1,00 TL&apos;lik bir ödeme oturumu açma isteği gönderir; kart bilgisi girilmediği için <b>para çekilmez</b>.
          Banka bir değişiklik yaptığını bildirdiğinde sipariş vermeden buradan deneyebilirsiniz.
        </p>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-full"
      >
        {pending ? 'Bankaya soruluyor...' : 'Bağlantıyı test et'}
      </button>
      {result && (
        <div
          className={`text-sm rounded-lg px-3 py-2 border space-y-2 ${
            result.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <p>
            {result.ok ? '✅ ' : '⚠️ '}
            {result.message}
          </p>
          {result.bankResponse && (
            <p className="font-mono text-xs break-all">Banka yanıtı: {result.bankResponse}</p>
          )}
          {result.config.length > 0 && (
            <div className="text-xs text-carbon/70">
              <p className="font-semibold">Vercel&apos;deki bilgilerin biçimi:</p>
              <ul className="list-disc ml-5">
                {result.config.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
