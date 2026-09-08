'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savedAddressSchema, type SavedAddressInput } from '@/lib/validations/address';
import type { SavedAddress } from '@/lib/data/account';
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction
} from '@/app/hesabim/adres-actions';

const EMPTY: SavedAddressInput = {
  label: '',
  fullName: '',
  phone: '',
  city: '',
  district: '',
  addressLine: ''
};

function AddressFields({
  value,
  onChange
}: {
  value: SavedAddressInput;
  onChange: (v: SavedAddressInput) => void;
}) {
  const set = (patch: Partial<SavedAddressInput>) => onChange({ ...value, ...patch });
  return (
    <div className="grid sm:grid-cols-2 gap-2.5">
      <input
        placeholder="Başlık (Ev, İş...)"
        className="adr-input"
        value={value.label}
        onChange={(e) => set({ label: e.target.value })}
      />
      <input
        placeholder="Ad Soyad"
        className="adr-input"
        value={value.fullName}
        onChange={(e) => set({ fullName: e.target.value })}
      />
      <input
        type="tel"
        placeholder="Telefon (05xx xxx xx xx)"
        className="adr-input"
        value={value.phone}
        onChange={(e) => set({ phone: e.target.value })}
      />
      <input
        placeholder="İl"
        className="adr-input"
        value={value.city}
        onChange={(e) => set({ city: e.target.value })}
      />
      <input
        placeholder="İlçe"
        className="adr-input"
        value={value.district}
        onChange={(e) => set({ district: e.target.value })}
      />
      <textarea
        placeholder="Açık Adres (Mahalle, Sokak, No, Daire)"
        rows={2}
        className="adr-input sm:col-span-2"
        value={value.addressLine}
        onChange={(e) => set({ addressLine: e.target.value })}
      />
    </div>
  );
}

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newAddr, setNewAddr] = useState<SavedAddressInput>(EMPTY);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddr, setEditAddr] = useState<SavedAddressInput>(EMPTY);

  function run(fn: () => Promise<{ error: string | null }>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        return;
      }
      onOk?.();
      router.refresh();
    });
  }

  function submitNew() {
    const parsed = savedAddressSchema.safeParse(newAddr);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Geçersiz adres bilgisi.');
      return;
    }
    run(() => createAddressAction(parsed.data), () => {
      setAdding(false);
      setNewAddr(EMPTY);
    });
  }

  function submitEdit(id: string) {
    const parsed = savedAddressSchema.safeParse(editAddr);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Geçersiz adres bilgisi.');
      return;
    }
    run(() => updateAddressAction(id, parsed.data), () => setEditingId(null));
  }

  function startEdit(a: SavedAddress) {
    setError(null);
    setEditingId(a.id);
    setEditAddr({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      city: a.city,
      district: a.district,
      addressLine: a.addressLine
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {error}</div>
      )}

      {addresses.length === 0 && !adding && (
        <p className="text-sm text-carbon/50">Henüz kayıtlı adresiniz yok.</p>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
            {editingId === a.id ? (
              <div className="space-y-3">
                <AddressFields value={editAddr} onChange={setEditAddr} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => submitEdit(a.id)}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-full"
                  >
                    {pending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setEditingId(null)}
                    className="border border-primary/20 text-carbon/60 font-semibold text-sm px-4 py-2 rounded-full"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-carbon/70 leading-relaxed min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-carbon">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  {a.fullName} · {a.phone}
                  <br />
                  {a.district} / {a.city}
                  <br />
                  <span className="text-carbon/50">{a.addressLine}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Düzenle
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setDefaultAddressAction(a.id))}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      Varsayılan yap
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm('Bu adres silinsin mi?')) run(() => deleteAddressAction(a.id));
                    }}
                    className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-primary text-sm">Yeni Adres</h3>
          <AddressFields value={newAddr} onChange={setNewAddr} />
          <label className="flex items-center gap-2 text-xs text-carbon/60 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary w-4 h-4"
              checked={newAddr.isDefault ?? false}
              onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
            />
            Varsayılan teslimat adresim olsun
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={submitNew}
              className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-full"
            >
              {pending ? 'Kaydediliyor...' : 'Adresi Kaydet'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setAdding(false);
                setNewAddr(EMPTY);
                setError(null);
              }}
              className="border border-primary/20 text-carbon/60 font-semibold text-sm px-4 py-2 rounded-full"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAdding(true);
          }}
          className="touch-target inline-flex items-center gap-2 border border-dashed border-primary/30 text-primary font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-primary/5 transition"
        >
          + Yeni Adres Ekle
        </button>
      )}

      <style jsx global>{`
        .adr-input {
          background: #f4f1ea;
          border: 1px solid rgba(27, 67, 50, 0.15);
          border-radius: 0.75rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.875rem;
          width: 100%;
        }
        .adr-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(212, 163, 115, 0.5);
        }
      `}</style>
    </div>
  );
}
