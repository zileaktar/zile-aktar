/**
 * Sağlık beyanı uyarısı — Tarım ve Orman Bakanlığı / Sağlık Bakanlığı mevzuatı
 * gereği bitkisel ürünlerin ilaç/tedavi ürünü gibi sunulmadığını belirten
 * zorunlu bilgilendirme. Ürün detay sayfasında ve ödeme sayfasında gösterilir.
 */
export function HealthDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-primary/15 bg-cream/60 text-carbon/60 ${
        compact ? 'p-3 text-[11px]' : 'p-4 text-xs'
      }`}
    >
      <span className="font-semibold text-carbon/70">Bilgilendirme:</span> Bu ürün Sağlık Bakanlığı&apos;nca onaylı bir
      tıbbi ürün veya ilaç değildir; gıda/takviye amaçlıdır. Hastalıkların teşhis, tedavi veya önlenmesi amacıyla
      kullanılmaz. Herhangi bir sağlık sorununuz varsa veya ilaç kullanıyorsanız tüketmeden önce hekiminize danışın.
      Hamilelik, emzirme döneminde ve çocuklarda kullanımı için uzman görüşü alınız.
    </div>
  );
}
