'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getProductImageUrl } from '@/lib/media';
import { updateLogoAction, type SettingsFormState } from '@/app/admin/ayarlar/actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-6 py-3 rounded-full transition"
    >
      {pending ? 'Kaydediliyor...' : 'Logoyu Kaydet'}
    </button>
  );
}

export function LogoSettingsForm({ currentLogoPath }: { currentLogoPath: string | null }) {
  const [state, formAction] = useFormState<SettingsFormState, FormData>(updateLogoAction, { error: null });
  const [logoPath, setLogoPath] = useState(currentLogoPath ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const isFirstRender = useRef(true);

  // `state` yalnızca formAction bir sunucu turu tamamladığında değişir; ilk
  // render'da (henüz hiç gönderim yapılmamışken) bunu "başarıyla kaydedildi"
  // olarak yorumlamamak için ilk çalışma atlanır.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSavedMessage(state.error === null);
  }, [state]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setSavedMessage(false);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const res = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${crypto.randomUUID()}.${ext}`, contentType: file.type, folder: 'site' })
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? 'Yükleme bağlantısı alınamadı.');
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage.from('product-images').uploadToSignedUrl(data.objectPath, data.token, file);
      if (error) {
        setUploadError('Dosya yüklenemedi: ' + error.message);
        return;
      }
      setLogoPath(data.path);
    } catch (err) {
      // Gerçek hatayı konsola yazıyoruz — aksi halde teşhis imkânsız hale gelir.
      console.error('Logo yükleme hatası:', err);
      setUploadError(`Yükleme sırasında beklenmeyen bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-4 max-w-lg">
      <h2 className="font-display font-bold text-primary">Site Logosu</h2>
      <p className="text-xs text-carbon/50">
        Yüklenen görsel, üst menü, alt menü ve mobil çekmecede kullanılır. Yükseklik otomatik uyarlanır, kare veya yatay
        formatlı, şeffaf arka planlı (PNG) bir logo önerilir.
      </p>

      <input type="hidden" name="logoPath" value={logoPath} />

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-cream border border-primary/10 flex items-center justify-center overflow-hidden shrink-0">
          {logoPath ? <Image src={getProductImageUrl(logoPath)} alt="Logo önizleme" width={64} height={64} className="object-contain" /> : <span className="text-2xl">🌿</span>}
        </div>
        <div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="text-sm" />
          {uploading && <p className="text-xs text-carbon/50 mt-1">Yükleniyor...</p>}
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>

      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{state.error}</div>}
      {savedMessage && !state.error && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">Logo kaydedildi.</div>}

      <SaveButton />
    </form>
  );
}
