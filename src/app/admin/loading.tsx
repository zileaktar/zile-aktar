/**
 * Yönetim panelinde sayfalar arası geçişte ANINDA gösterilen iskelet.
 * Sayfalar her seferinde güncel veriyi sunucudan çektiği için (force-dynamic)
 * kısa bir bekleme olur; bu görüntü olmadan tıklama "işlemedi" sanılıyordu.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Yükleniyor…</span>
      <div className="h-7 w-48 rounded-lg bg-primary/10" />
      <div className="h-4 w-72 max-w-full rounded bg-primary/5" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-36 rounded-2xl bg-white shadow-sm" />
        <div className="h-36 rounded-2xl bg-white shadow-sm" />
      </div>
      <div className="h-48 rounded-2xl bg-white shadow-sm" />
    </div>
  );
}
