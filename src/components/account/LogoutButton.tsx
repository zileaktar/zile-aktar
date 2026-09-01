'use client';

import { useFormStatus } from 'react-dom';
import { signOutAction } from '@/lib/actions/auth';

/**
 * Çıkış, sunucu tarafı Server Action ile yapılır — bkz. src/lib/actions/auth.ts
 * (httpOnly oturum çerezleri istemci JavaScript'i tarafından silinemediği için).
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
    >
      {pending ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
