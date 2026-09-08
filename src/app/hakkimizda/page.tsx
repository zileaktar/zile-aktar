import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    'Zile Aktar — Tokat Zile\'de aktar dükkanı ve online satış. Katkısız yöresel ürünler: soğuk sıkım yağlar, taze baharatlar, bitki çayları, doğal kozmetik ve sirkeler.',
  alternates: { canonical: '/hakkimizda' }
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-2">Hakkımızda</h1>
      <p className="text-sm text-carbon/60 mb-8">
        Aktarlık geleneğini Tokat Zile&apos;deki dükkanımızdan Türkiye&apos;nin her yerine taşıyoruz.
      </p>

      <div className="space-y-8 text-[15px] leading-relaxed text-carbon/80">
        <section>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Biz Kimiz?</h2>
          <p>
            Zile Aktar, {LEGAL.markaAdi} markasıyla {LEGAL.unvan} tarafından işletilen bir aktar ve yöresel ürünler
            satış noktasıdır. Zile&apos;deki dükkanımızda uzun yıllardır aktarlık yapıyor; baharattan bitki çayına,
            soğuk sıkım yağlardan doğal kozmetik ve sirkelere kadar geniş bir ürün yelpazesini müşterilerimize
            sunuyoruz. Bu web sitesiyle birlikte aynı ürünleri, aynı özenle Türkiye&apos;nin her yerine gönderiyoruz.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Ne Satıyoruz?</h2>
          <p className="mb-2">Ürünlerimiz beş ana grupta toplanıyor:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Soğuk sıkım ve botanik yağlar</li>
            <li>Taze çekilmiş ve tane baharatlar</li>
            <li>Şifalı bitki çayları ve karışımları</li>
            <li>Doğal içerikli kozmetik ürünleri</li>
            <li>Geleneksel yöntemlerle üretilen sirkeler</li>
          </ul>
          <p className="mt-2">
            Her ürünün menşei, saklama koşulu ve varsa alerjen bilgisi ilgili ürün sayfasında belirtilir.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Yaklaşımımız</h2>
          <p>
            Ürünlerimizi katkı maddesi içermeyecek şekilde, mümkün olduğunca doğrudan üreticiden temin ediyoruz.
            Sattığımız ürünler gıda ve gıda takviyesi niteliğindedir; hastalıkların önlenmesi ya da tedavisi
            amacıyla kullanılamaz. Bir sağlık sorununuz varsa lütfen hekiminize danışın. Ambalajlama ve
            etiketleme süreçlerimizi gıda mevzuatına uygun şekilde yürütüyoruz.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Mağazamız</h2>
          <p className="mb-1">
            <span className="font-medium text-carbon">Adres:</span> {LEGAL.adres}
          </p>
          <p className="mb-1">
            <span className="font-medium text-carbon">Çalışma saatleri:</span> {LEGAL.calismaSaatleri}
          </p>
          <p className="mb-1">
            <span className="font-medium text-carbon">Telefon:</span>{' '}
            <a
              href={`tel:+90${LEGAL.telefon.replace(/\D/g, '').replace(/^0/, '')}`}
              className="text-primary underline"
            >
              {LEGAL.telefon}
            </a>
          </p>
          <p>
            Konum ve yol tarifi için{' '}
            <Link href="/iletisim" className="text-primary underline">
              İletişim
            </Link>{' '}
            sayfamıza bakabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Bize Ulaşın</h2>
          <p>
            Ürünler, siparişiniz veya toptan alım hakkında her türlü sorunuz için{' '}
            <a href={`mailto:${LEGAL.eposta}`} className="text-primary underline">
              {LEGAL.eposta}
            </a>{' '}
            adresinden ya da{' '}
            <a
              href={`https://wa.me/90${LEGAL.telefon.replace(/\D/g, '').replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              WhatsApp
            </a>{' '}
            üzerinden bize yazabilirsiniz. Mesajlarınıza en geç 1 iş günü içinde dönüş yapıyoruz.
          </p>
        </section>
      </div>
    </div>
  );
}
