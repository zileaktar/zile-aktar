'use client';

// Sayfa/segment seviyesi hata sınırı. Bir Server/Client Component render sırasında
// hata fırlatırsa Next.js bu bileşeni (layout — header/footer — İÇİNDE) gösterir.
// Hata Sentry'ye iletilir; kullanıcıya asla stack trace veya teknik detay gösterilmez.
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-4xl mx-auto mb-5">⚠️</div>
      <h1 className="font-display font-bold text-xl text-primary mb-2">Bir şeyler ters gitti</h1>
      <p className="text-sm text-carbon/60 mb-6">
        Beklenmeyen bir hata oluştu. Ekibimiz bilgilendirildi. Lütfen tekrar deneyin; sorun sürerse bizimle iletişime geçin.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition"
        >
          Tekrar Dene
        </button>
        <a href="/" className="touch-target inline-block border border-primary/20 text-primary font-bold px-8 py-3.5 rounded-full transition">
          Ana Sayfa
        </a>
      </div>
    </div>
  );
}
