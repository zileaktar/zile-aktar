export const metadata = { title: 'Mesafeli Satış Sözleşmesi' };

export default function DistanceSalesAgreementPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-primary mb-4">Mesafeli Satış Sözleşmesi</h1>
      <p className="text-xs text-carbon/50 mb-6">
        ⚠️ Bu metin bir ŞABLONDUR. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği&apos;ne
        tam uyum için bir hukuk danışmanına onaylatılmalı; şirket unvanı, MERSİS no, cayma hakkı süreleri ve iade
        prosedürü işletmenizin gerçek bilgileriyle doldurulmalıdır.
      </p>
      <div className="space-y-4 text-sm text-carbon/70 leading-relaxed">
        <h2 className="font-semibold text-primary">Taraflar</h2>
        <p>İşbu sözleşme, Zile Aktar (&quot;Satıcı&quot;) ile siparişi veren kullanıcı (&quot;Alıcı&quot;) arasında elektronik ortamda kurulmuştur.</p>
        <h2 className="font-semibold text-primary">Cayma Hakkı</h2>
        <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin sözleşmeden cayma hakkına sahiptir. Gıda niteliğindeki bozulabilir/açılmış ürünlerde bu hak, ilgili mevzuattaki istisnalara tabidir.</p>
        <h2 className="font-semibold text-primary">Teslimat</h2>
        <p>Siparişler, ödemenin onaylanmasını takiben kargo süreçlerine göre 1-5 iş günü içinde kargoya teslim edilir.</p>
      </div>
    </div>
  );
}
