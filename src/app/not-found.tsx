import Link from 'next/link';

// 404 — var olmayan bir URL veya notFound() çağrısı. Layout (header/footer) içinde gösterilir.
export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl mx-auto mb-5">🔍</div>
      <h1 className="font-display font-bold text-xl text-primary mb-2">Sayfa bulunamadı</h1>
      <p className="text-sm text-carbon/60 mb-6">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        href="/"
        className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
