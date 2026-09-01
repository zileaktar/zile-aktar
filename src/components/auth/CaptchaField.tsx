'use client';

import { forwardRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { env } from '@/lib/env.mjs';

/**
 * Cloudflare Turnstile CAPTCHA alanı. Supabase Auth panelinde CAPTCHA koruması
 * açık olduğundan giriş/kayıt istekleri geçerli bir token olmadan reddedilir.
 *
 * Token TEK KULLANIMLIKTIR: başarısız bir giriş denemesinden sonra çağıran bileşen
 * `ref.current?.reset()` ile widget'ı sıfırlamalı ve token state'ini temizlemelidir.
 * `onToken(null)` — token süresi dolduğunda veya bir hata olduğunda gönderilir.
 */
export const CaptchaField = forwardRef<TurnstileInstance, { onToken: (token: string | null) => void }>(
  function CaptchaField({ onToken }, ref) {
    return (
      <div className="flex justify-center">
        <Turnstile
          ref={ref}
          siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          options={{ theme: 'light', language: 'tr', size: 'flexible' }}
          onSuccess={(token) => onToken(token)}
          onExpire={() => onToken(null)}
          onError={() => onToken(null)}
        />
      </div>
    );
  }
);
