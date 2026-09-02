'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getProductImageUrl } from '@/lib/media';
import {
  saveBannerAction,
  toggleBannerAction,
  deleteBannerAction,
  moveBannerAction,
  type BannerActionState
} from '@/app/admin/afisler/actions';
import type { CampaignBannerRow } from '@/lib/supabase/types';

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition"
    >
      {pending ? 'Kaydediliyor...' : isNew ? 'Afişi Ekle' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

function BannerEditor({ banner }: { banner?: CampaignBannerRow }) {
  const router = useRouter();
  const isNew = !banner;
  const boundAction = saveBannerAction.bind(null, banner?.id ?? null);
  const [state, formAction] = useFormState<BannerActionState, FormData>(boundAction, { error: null });

  const [imagePath, setImagePath] = useState(banner?.image_path ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const firstRender = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.ok) {
      router.refresh();
      if (isNew) {
        formRef.current?.reset();
        setImagePath('');
      }
    }
  }, [state, isNew, router]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const res = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${crypto.randomUUID()}.${ext}`, contentType: file.type, folder: 'banners' })
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
      setImagePath(data.path);
    } catch (err) {
      console.error('Afiş görseli yükleme hatası:', err);
      setUploadError('Yükleme sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="imagePath" value={imagePath} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="w-40 aspect-[21/9] rounded-lg overflow-hidden bg-cream border border-primary/10 shrink-0">
          {imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getProductImageUrl(imagePath)} alt="Afiş önizleme" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-carbon/30">🖼️</div>
          )}
        </div>
        <div className="text-sm">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="text-sm" />
          <p className="text-xs text-carbon/50 mt-1">Geniş (yatay) görsel önerilir — örn. 1600×685 px.</p>
          {uploading && <p className="text-xs text-carbon/50 mt-1">Yükleniyor...</p>}
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <input
          name="title"
          defaultValue={banner?.title ?? ''}
          maxLength={120}
          placeholder="Başlık (ops.) — örn. Yeni Sezon Ballar"
          className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="ctaLabel"
          defaultValue={banner?.cta_label ?? ''}
          maxLength={40}
          placeholder="Buton metni (ops.) — örn. İncele"
          className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <input
        name="subtitle"
        defaultValue={banner?.subtitle ?? ''}
        maxLength={240}
        placeholder="Alt başlık (ops.)"
        className="w-full bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
      />
      <input
        name="linkUrl"
        defaultValue={banner?.link_url ?? ''}
        maxLength={500}
        placeholder='Bağlantı (ops.) — örn. /?kategori=bal veya https://...'
        className="w-full bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm font-mono"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && !isNew && <p className="text-xs text-green-700">Kaydedildi.</p>}

      <SaveButton isNew={isNew} />
    </form>
  );
}

function BannerControls({ banner, isFirst, isLast }: { banner: CampaignBannerRow; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<BannerActionState>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleBannerAction(banner.id))}
        className={`font-semibold ${banner.is_active ? 'text-amber-700' : 'text-green-700'} hover:underline disabled:opacity-50`}
      >
        {banner.is_active ? 'Pasife al' : 'Aktif et'}
      </button>
      <button
        type="button"
        disabled={pending || isFirst}
        onClick={() => run(() => moveBannerAction(banner.id, 'up'))}
        className="text-primary hover:underline disabled:opacity-30"
      >
        ↑ Yukarı
      </button>
      <button
        type="button"
        disabled={pending || isLast}
        onClick={() => run(() => moveBannerAction(banner.id, 'down'))}
        className="text-primary hover:underline disabled:opacity-30"
      >
        ↓ Aşağı
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm('Bu afişi kalıcı olarak silmek istiyor musunuz?')) run(() => deleteBannerAction(banner.id));
        }}
        className="text-red-500 hover:underline disabled:opacity-50"
      >
        Sil
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

export function BannerManager({ banners }: { banners: CampaignBannerRow[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-display font-bold text-primary mb-1">Yeni Afiş Ekle</h2>
        <p className="text-xs text-carbon/50 mb-4">
          Anasayfanın en üstünde kaydırmalı olarak gösterilir. Yalnızca görsel de yeterlidir; başlık/buton eklersen görselin
          üzerine yazı biner.
        </p>
        <BannerEditor />
      </div>

      <div>
        <h2 className="font-display font-bold text-primary mb-3">Mevcut Afişler ({banners.length})</h2>
        {banners.length === 0 ? (
          <p className="text-sm text-carbon/50">Henüz afiş yok. Afiş eklemezsen anasayfada sade tanıtım başlığı gösterilir.</p>
        ) : (
          <div className="space-y-4">
            {banners.map((b, i) => (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 shadow-sm ${b.is_active ? '' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream text-carbon/60">
                    {b.is_active ? `Sıra ${i + 1}` : 'Pasif'}
                  </span>
                  <BannerControls banner={b} isFirst={i === 0} isLast={i === banners.length - 1} />
                </div>
                <BannerEditor banner={b} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
