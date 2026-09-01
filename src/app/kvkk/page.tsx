export const metadata = { title: 'KVKK Aydınlatma Metni' };

export default function KvkkPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm">
      <h1 className="font-display font-bold text-2xl text-primary mb-4">KVKK Aydınlatma Metni</h1>
      <p className="text-xs text-carbon/50 mb-6">
        ⚠️ Bu metin bir ŞABLONDUR. Yayına almadan önce mutlaka bir hukuk danışmanına/KVKK uzmanına onaylatın —
        veri işleme envanterinizi, gerçek veri saklama sürelerinizi ve tedarikçilerinizi (Supabase, iyzico, Sentry,
        Upstash vb.) yansıtacak şekilde güncellenmelidir.
      </p>
      <div className="space-y-4 text-sm text-carbon/70 leading-relaxed">
        <p>
          Zile Aktar (&quot;Veri Sorumlusu&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel
          verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.
        </p>
        <h2 className="font-semibold text-primary">İşlenen Veriler</h2>
        <p>Ad-soyad, e-posta, telefon, teslimat adresi, sipariş geçmişi ve ödeme işlem kayıtları (kart bilgileri hariç — kart verisi iyzico&apos;nun PCI-DSS uyumlu altyapısında işlenir, tarafımızca hiç saklanmaz).</p>
        <h2 className="font-semibold text-primary">İşleme Amaçları</h2>
        <p>Sipariş oluşturma ve teslimat, yasal faturalama yükümlülükleri, müşteri destek talepleri, açık rızanız halinde pazarlama iletişimi.</p>
        <h2 className="font-semibold text-primary">Haklarınız (KVKK m.11)</h2>
        <p>
          Verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, düzeltme, silme ve verilerinizi taşınabilir
          formatta talep etme haklarına sahipsiniz. Bu hakları{' '}
          <a href="/hesabim/veri-talebi" className="text-primary underline">
            Hesabım → KVKK Veri Talebi
          </a>{' '}
          sayfasından kendiniz kullanabilir veya zileaktar@gmail.com adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}
