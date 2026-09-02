'use client';

import { useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getProductImageUrl } from '@/lib/media';
import type { ProductFormState } from '@/app/admin/urunler/actions';
import { deleteVariantAction } from '@/app/admin/urunler/actions';
import { PRODUCT_FORMS, PRODUCT_FORM_LABELS } from '@/lib/validations/product';
import type { ProductForm as ProductFormEnum } from '@/lib/supabase/types';

// "Sınırlı Stok" burada KASITLI olarak yok — artık elle seçilen sabit bir
// etiket değil, gerçek stok sayısından CANLI hesaplanan bir gösterge
// (bkz. ProductCard.tsx / ProductDetailClient.tsx). Stoğu 3 iken bu etiketi
// eklerseniz ve sonra stoğu 100'e çıkarsanız, sabit etiket olduğu için
// "Sınırlı Stok" yazısı yanlışlıkla kalıcı olurdu — bu yüzden kaldırıldı.
const BADGE_OPTIONS = ['100% Doğal', 'Soğuk Sıkım', 'Yöresel', 'Geleneksel'] as const;

interface VariantRow {
  id?: string; // yalnızca düzenleme modunda, mevcut (veritabanındaki) varyantlarda dolu
  label: string;
  price: string; // TL cinsinden, kullanıcının yazdığı ham metin (örn. "150" veya "150,50")
  compareAtPrice: string; // indirimsiz (üstü çizili) fiyat, TL — boş ise indirim yok
  stock: string;
  lotNo: string;
  expiryDate: string; // YYYY-AA-GG veya ''
}

const EMPTY_VARIANT: VariantRow = { label: '', price: '', compareAtPrice: '', stock: '', lotNo: '', expiryDate: '' };

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: Category[];
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initialProduct?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    imagePath: string;
    categoryId: string;
    badges: string[];
    isActive: boolean;
    form: ProductFormEnum | null;
    origin: string;
    storageInfo: string;
    allergenInfo: string;
    shelfLifeNote: string;
    variants: VariantRow[];
  };
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * TL cinsinden kullanıcı girdisini kuruşa çevirir. İki farklı biçimi doğru
 * ayırt eder — bu ayrım eksikti ve düzenleme formunda "350.00" (JS'in
 * toFixed(2) ürettiği İNGİLİZCE ondalık biçim) yanlışlıkla Türkçe binlik
 * ayracı sanılıp "35000"e, sonra da 3.500.000 kuruşa (35.000 TL) dönüşüyordu:
 *  - Virgül İÇEREN girdi Türkçe kabul edilir: "1.234,56" -> noktalar (binlik)
 *    silinir, virgül (ondalık) noktaya çevrilir -> 1234.56
 *  - Virgül İÇERMEYEN girdi (kullanıcının "350" yazması veya formun "350.00"
 *    ile doldurması) OLDUĞU GİBİ ondalık sayı olarak ayrıştırılır -> 350
 */
function tlToCents(value: string): number {
  const trimmed = value.trim();
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-6 py-3 rounded-full transition"
    >
      {pending ? 'Kaydediliyor...' : label}
    </button>
  );
}

export function ProductForm({ mode, categories, action, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState<ProductFormState, FormData>(action, { error: null });

  const [name, setName] = useState(initialProduct?.name ?? '');
  const [slug, setSlug] = useState(initialProduct?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? categories[0]?.id ?? '');
  // Veritabanında eski/durgun bir "Sınırlı Stok" etiketi kalmışsa formu
  // açarken temizlenir — bir sonraki kayıtta bu etiket kendiliğinden düşer.
  const [badges, setBadges] = useState<Set<string>>(new Set((initialProduct?.badges ?? []).filter((b) => b !== 'Sınırlı Stok')));
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [form, setForm] = useState<string>(initialProduct?.form ?? '');
  const [origin, setOrigin] = useState(initialProduct?.origin ?? '');
  const [storageInfo, setStorageInfo] = useState(initialProduct?.storageInfo ?? '');
  const [allergenInfo, setAllergenInfo] = useState(initialProduct?.allergenInfo ?? '');
  const [shelfLifeNote, setShelfLifeNote] = useState(initialProduct?.shelfLifeNote ?? '');
  const [variants, setVariants] = useState<VariantRow[]>(initialProduct?.variants ?? [{ ...EMPTY_VARIANT }]);

  const [imagePath, setImagePath] = useState(initialProduct?.imagePath ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const res = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${crypto.randomUUID()}.${ext}`, contentType: file.type })
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
      console.error('Ürün görseli yükleme hatası:', err);
      setUploadError(`Yükleme sırasında beklenmeyen bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addVariantRow() {
    setVariants((rows) => [...rows, { ...EMPTY_VARIANT }]);
  }

  function removeVariantRow(index: number) {
    const row = variants[index];
    if (row?.id) {
      // Veritabanında zaten var olan bir varyant — formdan çıkarmak yerine
      // gerçekten silmemiz gerekiyor (bkz. deleteVariantAction: geçmiş
      // siparişlerde kullanıldıysa veritabanı silmeyi reddeder).
      if (!confirm(`"${row.label}" varyantını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
      setDeleteError(null);
      startDeleteTransition(async () => {
        const result = await deleteVariantAction(row.id!, slug);
        if (result.error) {
          setDeleteError(result.error);
          return;
        }
        setVariants((rows) => rows.filter((_, i) => i !== index));
      });
    } else {
      setVariants((rows) => rows.filter((_, i) => i !== index));
    }
  }

  function toggleBadge(badge: string) {
    setBadges((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) next.delete(badge);
      else if (next.size < 4) next.add(badge);
      return next;
    });
  }

  const variantsJson = JSON.stringify(
    variants
      .filter((v) => v.label.trim())
      .map((v) => ({
        label: v.label.trim(),
        priceCents: tlToCents(v.price),
        compareAtPriceCents: v.compareAtPrice.trim() ? tlToCents(v.compareAtPrice) : null,
        stock: Number.parseInt(v.stock, 10) || 0,
        lotNo: v.lotNo.trim(),
        expiryDate: v.expiryDate.trim()
      }))
  );

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{state.error}</div>}
      {deleteError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{deleteError}</div>}

      <input type="hidden" name="imagePath" value={imagePath} />
      <input type="hidden" name="variantsJson" value={variantsJson} />

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-primary">Temel Bilgiler</h2>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Ürün Adı</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {state.fieldErrors?.name && <p className="text-xs text-red-600 mt-1">{state.fieldErrors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">
            Slug (URL) — <span className="font-normal">otomatik oluşur, isterseniz elle değiştirin</span>
          </label>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {state.fieldErrors?.slug && <p className="text-xs text-red-600 mt-1">{state.fieldErrors.slug}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Kategori</label>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">
            Açıklama — <span className="font-normal">&quot;## Başlık&quot;, &quot;- madde&quot;, &quot;⚠️ uyarı&quot; satırları özel biçimlendirilir</span>
          </label>
          <textarea
            name="description"
            rows={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-2 block">Rozetler (en fazla 4)</label>
          <div className="flex flex-wrap gap-2">
            {BADGE_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => toggleBadge(b)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  badges.has(b) ? 'bg-primary text-white border-primary' : 'bg-white text-carbon/60 border-primary/15'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          {Array.from(badges).map((b) => (
            <input key={b} type="hidden" name="badges" value={b} />
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary w-4 h-4" />
          Ürün sitede görünür olsun (aktif)
        </label>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-primary">Ürün Detay Bilgileri</h2>
        <p className="text-xs text-carbon/50">Hepsi opsiyonel. Ürün detay sayfasında müşteriye gösterilir.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-carbon/60 mb-1 block">Form (filtreleme için)</label>
            <select
              name="form"
              value={form}
              onChange={(e) => setForm(e.target.value)}
              className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">— seçilmedi —</option>
              {PRODUCT_FORMS.map((f) => (
                <option key={f} value={f}>
                  {PRODUCT_FORM_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-carbon/60 mb-1 block">Menşe / Yöre</label>
            <input
              name="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Örn. Tokat / Zile"
              className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-carbon/60 mb-1 block">Saklama Koşulu</label>
          <input
            name="storageInfo"
            value={storageInfo}
            onChange={(e) => setStorageInfo(e.target.value)}
            placeholder="Serin, kuru ve güneş görmeyen yerde, ağzı kapalı saklayınız."
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-carbon/60 mb-1 block">Alerjen Uyarısı</label>
            <input
              name="allergenInfo"
              value={allergenInfo}
              onChange={(e) => setAllergenInfo(e.target.value)}
              placeholder="Örn. Susam içerir"
              className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon/60 mb-1 block">Raf Ömrü Notu</label>
            <input
              name="shelfLifeNote"
              value={shelfLifeNote}
              onChange={(e) => setShelfLifeNote(e.target.value)}
              placeholder="Örn. Üretimden itibaren 24 ay"
              className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-primary">Ürün Görseli</h2>
        {imagePath && (
          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-cream">
            <Image src={getProductImageUrl(imagePath)} alt="Önizleme" fill className="object-cover" />
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="text-sm" />
        {uploading && <p className="text-xs text-carbon/50">Yükleniyor...</p>}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        {!imagePath && <p className="text-xs text-red-500">Görsel yüklenmeden kaydedilemez.</p>}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-primary">Gramaj / Fiyat / Stok</h2>
          <button type="button" onClick={addVariantRow} className="text-sm font-semibold text-primary hover:underline">
            + Varyant Ekle
          </button>
        </div>

        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="rounded-xl border border-primary/10 p-3 space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <input
                  placeholder="Gramaj (örn. 250g)"
                  value={v.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                  className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Fiyat (TL)"
                  inputMode="decimal"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: e.target.value })}
                  className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Stok"
                  inputMode="numeric"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: e.target.value })}
                  className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => removeVariantRow(i)}
                  className="touch-target flex items-center justify-center rounded-full hover:bg-red-50 text-red-400"
                  aria-label="Kaldır"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    placeholder="İndirimsiz fiyat (TL)"
                    inputMode="decimal"
                    title="İndirimden önceki fiyat — boş bırakırsanız indirim gösterilmez"
                    value={v.compareAtPrice}
                    onChange={(e) => updateVariant(i, { compareAtPrice: e.target.value })}
                    className="w-full bg-cream border border-primary/15 rounded-lg px-3 py-2 text-xs"
                  />
                  {v.compareAtPrice.trim() && v.price.trim() && tlToCents(v.compareAtPrice) > tlToCents(v.price) && (
                    <p className="text-[10px] text-accent-dark mt-0.5">
                      %{Math.round((1 - tlToCents(v.price) / tlToCents(v.compareAtPrice)) * 100)} indirim
                    </p>
                  )}
                </div>
                <input
                  placeholder="Parti / Lot No (ops.)"
                  value={v.lotNo}
                  onChange={(e) => updateVariant(i, { lotNo: e.target.value })}
                  className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-xs self-start"
                />
                <input
                  type="date"
                  title="Son Tüketim Tarihi"
                  value={v.expiryDate}
                  onChange={(e) => updateVariant(i, { expiryDate: e.target.value })}
                  className="bg-cream border border-primary/15 rounded-lg px-3 py-2 text-xs text-carbon/70 self-start"
                />
              </div>
              {state.fieldErrors?.[`variants.${i}.compareAtPriceCents`] && (
                <p className="text-xs text-red-600">{state.fieldErrors[`variants.${i}.compareAtPriceCents`]}</p>
              )}
            </div>
          ))}
        </div>
        {state.fieldErrors?.variants && <p className="text-xs text-red-600">{state.fieldErrors.variants}</p>}
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={mode === 'create' ? 'Ürünü Oluştur' : 'Değişiklikleri Kaydet'} />
        <button type="button" onClick={() => router.push('/admin/urunler')} className="text-sm font-semibold text-carbon/60 hover:text-carbon">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
