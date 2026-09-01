'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateBankInfoAction, type SettingsFormState } from '@/app/admin/ayarlar/actions';

interface BankInfo {
  accountHolder: string | null;
  bankName: string | null;
  iban: string | null;
  note: string | null;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-6 py-3 rounded-full transition"
    >
      {pending ? 'Kaydediliyor...' : 'Banka Bilgilerini Kaydet'}
    </button>
  );
}

export function BankInfoForm({ bank }: { bank: BankInfo }) {
  const [state, formAction] = useFormState<SettingsFormState, FormData>(updateBankInfoAction, { error: null });
  const [saved, setSaved] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(state.error === null);
  }, [state]);

  return (
    <form action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-4 max-w-lg">
      <h2 className="font-display font-bold text-primary">Havale / EFT Banka Bilgisi</h2>
      <p className="text-xs text-carbon/50">
        Bu bilgiler, müşteri &quot;Havale / EFT&quot; seçip siparişi tamamladığında onay sayfasında gösterilir. IBAN
        boş bırakılırsa müşteriye &quot;banka bilgileri tanımlı değil&quot; uyarısı çıkar.
      </p>

      <label className="block text-xs font-semibold text-carbon/60">
        Hesap Sahibi (Alıcı Adı)
        <input name="accountHolder" defaultValue={bank.accountHolder ?? ''} className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm" placeholder="Örn. Zile Aktar - Ahmet Yılmaz" />
      </label>

      <label className="block text-xs font-semibold text-carbon/60">
        Banka Adı
        <input name="bankName" defaultValue={bank.bankName ?? ''} className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm" placeholder="Örn. Ziraat Bankası" />
      </label>

      <label className="block text-xs font-semibold text-carbon/60">
        IBAN
        <input name="iban" defaultValue={bank.iban ?? ''} className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm font-mono" placeholder="TR00 0000 0000 0000 0000 0000 00" />
      </label>

      <label className="block text-xs font-semibold text-carbon/60">
        Ek Not (opsiyonel)
        <textarea name="note" defaultValue={bank.note ?? ''} rows={2} className="mt-1 w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm" placeholder="Örn. Ödeme sonrası dekontu WhatsApp'tan iletebilirsiniz." />
      </label>

      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{state.error}</div>}
      {saved && !state.error && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">Banka bilgileri kaydedildi.</div>}

      <SaveButton />
    </form>
  );
}
