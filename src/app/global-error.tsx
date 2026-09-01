'use client';

// KÖK hata sınırı — RootLayout'un KENDİSİ (veya çok erken bir aşama) render sırasında
// hata verirse devreye girer. Bu yüzden kendi <html>/<body> etiketlerini içermek
// ZORUNLUDUR (normal layout hiç render edilmemiş olabilir). Sentry entegrasyonu
// için gereklidir — bkz. next build uyarısı ("global-error.js").
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#f4f1ea',
          color: '#2b2b2b',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: '1rem',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.5rem' }}>Bir şeyler ters gitti</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(43,43,43,0.6)', marginBottom: '1.5rem' }}>
            Beklenmeyen bir hata oluştu. Ekibimiz bilgilendirildi. Lütfen sayfayı yenileyin.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: '#1b4332',
              color: '#fff',
              fontWeight: 700,
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              textDecoration: 'none'
            }}
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </body>
    </html>
  );
}
