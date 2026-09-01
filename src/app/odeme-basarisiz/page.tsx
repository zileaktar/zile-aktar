export default function PaymentFailedPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-4xl mx-auto mb-5">❌</div>
      <h1 className="font-display font-bold text-xl text-primary mb-2">Ödeme Tamamlanamadı</h1>
      <p className="text-sm text-carbon/60 mb-6">
        Ödemeniz sırasında bir sorun oluştu. Kartınızdan tutar çekilmedi. Lütfen kart bilgilerinizi kontrol edip tekrar
        deneyin.
      </p>
      <a href="/checkout" className="touch-target inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition">
        Tekrar Dene
      </a>
    </div>
  );
}
