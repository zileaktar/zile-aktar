'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DataRequestPage() {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    const res = await fetch('/api/account/export', { method: 'POST' });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kokten-aktar-verilerim.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationText })
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setError(data.error ?? 'Hesap silinemedi.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">KVKK Veri Talebi</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-primary mb-2">Verilerimi İndir</h2>
        <p className="text-sm text-carbon/60 mb-4">
          Sistemde sizinle ilgili tutulan tüm veriyi (profil, adresler, sipariş geçmişi) JSON formatında indirebilirsiniz.
        </p>
        <button onClick={handleExport} disabled={exporting} className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-full text-sm">
          {exporting ? 'Hazırlanıyor...' : '⬇️ Verilerimi İndir'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-200">
        <h2 className="font-semibold text-red-600 mb-2">Hesabımı Sil</h2>
        <p className="text-sm text-carbon/60 mb-4">
          Bu işlem geri alınamaz. Hesabınız ve kişisel verileriniz kalıcı olarak silinir. Yasal saklama yükümlülükleri
          nedeniyle sipariş kayıtlarınız anonimleştirilerek (kişisel bağlantı kesilerek) muhasebe amaçlı saklanmaya devam
          eder.
        </p>
        <p className="text-xs text-carbon/50 mb-2">
          Devam etmek için aşağıya tam olarak <b>HESABIMI SİL</b> yazın.
        </p>
        <input
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full bg-cream border border-red-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="HESABIMI SİL"
        />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button
          onClick={handleDelete}
          disabled={confirmationText !== 'HESABIMI SİL' || deleting}
          className="touch-target bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-full text-sm"
        >
          {deleting ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
        </button>
      </div>
    </div>
  );
}
