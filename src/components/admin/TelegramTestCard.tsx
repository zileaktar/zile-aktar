'use client';

import { useState, useTransition } from 'react';
import { sendTestNotificationAction, type TestNotificationResult } from '@/app/admin/ayarlar/actions';

/** Ayarlar sayfasında: canlı sunucudan Telegram'a test mesajı gönderir, sonucu gösterir. */
export function TelegramTestCard() {
  const [result, setResult] = useState<TestNotificationResult | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setResult(null);
    startTransition(async () => {
      setResult(await sendTestNotificationAction());
    });
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div>
        <h2 className="font-semibold text-primary">Telegram Bildirimleri</h2>
        <p className="text-xs text-carbon/60 mt-1">
          Yeni sipariş, başarısız ödeme ve iade/iptal taleplerinde telefonunuza mesaj gelir. Ayarların çalıştığını
          buradan deneyebilirsiniz.
        </p>
      </div>
      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-full"
      >
        {pending ? 'Gönderiliyor...' : 'Test bildirimi gönder'}
      </button>
      {result && (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            result.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {result.ok ? '✅ ' : '⚠️ '}
          {result.message}
        </p>
      )}
    </div>
  );
}
