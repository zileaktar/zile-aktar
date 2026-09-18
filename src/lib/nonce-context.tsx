'use client';

import { createContext, useContext } from 'react';

/**
 * CSP script-src nonce'u — middleware.ts'te üretilir, layout.tsx (server) bunu
 * `headers()` ile okuyup burada sağlar. Derinlerdeki client bileşenlerin
 * (ör. CaptchaField.tsx, Turnstile script'ini kendi enjekte ettiği için)
 * elle yazılan bir `<script>` etiketine nonce eklemesi gerektiğinde kullanılır.
 * next/script bileşenleri (Analytics.tsx) buna ihtiyaç DUYMAZ — Next.js
 * onlara nonce'u zaten otomatik uygular.
 */
const NonceContext = createContext<string>('');

export function NonceProvider({ nonce, children }: { nonce: string; children: React.ReactNode }) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

export function useNonce(): string {
  return useContext(NonceContext);
}
