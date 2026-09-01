'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateProfileAction, type ProfileFormState } from '@/app/hesabim/actions';

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition"
    >
      {pending ? 'Kaydediliyor...' : 'Kaydet'}
    </button>
  );
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, formAction] = useFormState<ProfileFormState, FormData>(updateProfileAction, { error: null });
  const [saved, setSaved] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(Boolean(state.saved) && state.error === null);
  }, [state]);

  return (
    <form action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <h2 className="font-semibold text-primary">Bilgilerim</h2>
      <label className="block text-xs font-semibold text-carbon/60">
        Ad Soyad
        <input
          name="fullName"
          defaultValue={fullName}
          required
          className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm"
        />
      </label>
      <label className="block text-xs font-semibold text-carbon/60">
        Telefon
        <input
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="05xx xxx xx xx"
          className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm"
        />
      </label>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {saved && !state.error && <p className="text-xs text-green-600">Kaydedildi.</p>}
      <SaveBtn />
    </form>
  );
}
