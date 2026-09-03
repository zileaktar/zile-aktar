import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL } from '@/lib/legal';
import { safeJsonLd } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description:
    'Zile Aktar — ödeme, kargo, teslimat süresi, iade ve cayma hakkı, ürün saklama ve hesap işlemleri hakkında en çok sorulan sorular ve yanıtları.',
  alternates: { canonical: '/sss' }
};

const kargoUcreti = LEGAL.standartKargoUcretiTl.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
const kargoFirmasi = LEGAL.kargoFirmasi.startsWith('[') ? 'anlaşmalı kargo firmamız' : LEGAL.kargoFirmasi;

interface QA {
  q: string;
  a: string;
}

const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: 'Sipariş ve Ödeme',
    items: [
      {
        q: 'Hangi ödeme yöntemlerini kullanabilirim?',
        a: `Kredi/banka kartı (iyzico 3D Secure altyapısı) ve Havale/EFT ile ödeme yapabilirsiniz. Kapıda ödeme bulunmamaktadır.`
      },
      {
        q: 'Kart bilgilerim güvende mi?',
        a: `Evet. Kart bilgilerinizi iyzico'nun PCI-DSS uyumlu güvenli sayfasında girersiniz; bu bilgiler bize hiçbir zaman ulaşmaz. Tüm kart ödemeleri 3D Secure ile doğrulanır.`
      },
      {
        q: 'Havale/EFT ile nasıl öderim?',
        a: `Siparişi tamamladığınızda banka hesap bilgilerimiz (IBAN) ekranda gösterilir. Havale/EFT açıklamasına sipariş numaranızı yazın. Ödemeniz hesabımıza geçtiğinde siparişiniz hazırlanmaya başlar; o ana kadar ürünler sizin için ayrılır.`
      },
      {
        q: 'Sipariş verdim ama onay e-postası gelmedi.',
        a: `Onay e-postası genellikle birkaç dakika içinde ulaşır. Gelen kutunuzda yoksa spam/gereksiz klasörünü kontrol edin. Yine göremiyorsanız sipariş numaranızla ${LEGAL.telefon} veya ${LEGAL.eposta} üzerinden bize ulaşın.`
      },
      {
        q: 'Siparişimi iptal edebilir miyim?',
        a: `Siparişiniz henüz kargoya verilmediyse ${LEGAL.telefon} veya ${LEGAL.eposta} üzerinden bize ulaşarak iptal ettirebilirsiniz. Kart ödemesi yapılmışsa iade, ödeme yönteminize yansıtılır.`
      },
      {
        q: 'İndirim kodunu nereye giriyorum?',
        a: `Ödeme sayfasındaki "Sipariş Özeti" bölümünde "İndirim Kodu" kutusuna kodu yazıp "Uygula" deyin. İndirim anında toplama yansır.`
      }
    ]
  },
  {
    title: 'Kargo ve Teslimat',
    items: [
      {
        q: 'Kargo ücreti ne kadar?',
        a: `${LEGAL.ucretsizKargoEsigiTl} ₺ altındaki siparişlerde kargo ücreti ${kargoUcreti} ₺'dir. ${LEGAL.ucretsizKargoEsigiTl} ₺ ve üzeri siparişlerde kargo ücretsizdir.`
      },
      {
        q: 'Siparişim ne kadar sürede elime ulaşır?',
        a: `Ödemeniz onaylandıktan sonra siparişiniz ${LEGAL.teslimatSuresiIsGunu} iş günü içinde hazırlanıp kargoya verilir. Teslimat süresi bulunduğunuz bölgeye ve kargo firmasına göre değişebilir.`
      },
      {
        q: 'Kargomu nasıl takip ederim?',
        a: `Siparişiniz kargoya verildiğinde kargo firması ve takip numarasını içeren bir bilgi e-postası gönderilir. Takip numarasıyla kargo firmasının web sitesinden durumu izleyebilirsiniz.`
      },
      {
        q: 'Hangi kargo firmasıyla gönderiyorsunuz?',
        a: `Siparişleriniz ${kargoFirmasi} ile gönderilir. Adresinize göre farklı bir firma kullanılabilir; takip bilgisi e-postada iletilir.`
      },
      {
        q: 'Yurt dışına gönderim yapıyor musunuz?',
        a: `Şu an yalnızca Türkiye içine gönderim yapılmaktadır.`
      }
    ]
  },
  {
    title: 'İade, Değişim ve Cayma Hakkı',
    items: [
      {
        q: 'Cayma hakkım var mı?',
        a: `Ürünü teslim aldığınız tarihten itibaren ${LEGAL.caymaSuresiGun} gün içinde hiçbir gerekçe göstermeden cayma hakkınız vardır. Ancak mevzuat gereği ambalajı açılmış gıda ürünleri ile hızlı bozulan/son kullanma tarihi geçebilecek ürünlerde cayma hakkı kullanılamaz. Ayrıntılar için İptal, İade ve Cayma Hakkı sayfamıza bakın.`
      },
      {
        q: 'İade sürecini nasıl başlatırım?',
        a: `${LEGAL.iadeIcinIletisim} üzerinden sipariş numaranızla bize ulaşın. Size iade adresini ve adımları ileteceğiz. Ürünü orijinal ambalajıyla, faturasıyla birlikte gönderin.`
      },
      {
        q: 'Param ne zaman iade edilir?',
        a: `İade ettiğiniz ürün bize ulaşıp kontrol edildikten sonra, ödemeyi yaptığınız yönteme (kart veya havale) en geç ${LEGAL.caymaSuresiGun} gün içinde iade edilir.`
      },
      {
        q: 'Ürün hasarlı veya yanlış geldi, ne yapmalıyım?',
        a: `Paketi açarken çektiğiniz fotoğraflarla birlikte ${LEGAL.telefon} veya ${LEGAL.eposta} üzerinden bize ulaşın. Hatalı/hasarlı ürünlerde kargo ücreti bize ait olmak üzere değişim veya iade yaparız.`
      }
    ]
  },
  {
    title: 'Ürünler',
    items: [
      {
        q: 'Ürünler gerçekten doğal mı?',
        a: `Ürünlerimiz katkı maddesi içermeyecek şekilde, doğrudan üreticiden temin edilir. Her ürünün menşei, saklama koşulu ve varsa alerjen bilgisi ürün sayfasında belirtilir.`
      },
      {
        q: 'Ürünleri nasıl saklamalıyım?',
        a: `Genel kural: serin, kuru ve güneş görmeyen bir yerde, ağzı kapalı olarak saklayın. Her ürünün kendi sayfasında ürüne özel saklama önerisi yer alır.`
      },
      {
        q: 'Son tüketim tarihini ve parti numarasını nereden görebilirim?',
        a: `Ürün sayfasında seçtiğiniz gramaj/boyut için son tüketim tarihi ve parti (lot) numarası — girildiyse — fiyatın altında gösterilir.`
      },
      {
        q: 'Bitkisel ürünler hastalık tedavi eder mi?',
        a: `Hayır. Sattığımız ürünler gıda ve gıda takviyesi niteliğindedir; hastalıkların önlenmesi veya tedavisi amacıyla kullanılamaz. Bir sağlık sorununuz varsa mutlaka hekiminize danışın.`
      }
    ]
  },
  {
    title: 'Hesap ve Gizlilik',
    items: [
      {
        q: 'Üye olmadan alışveriş yapabilir miyim?',
        a: `Evet, misafir olarak sipariş verebilirsiniz. Üye olursanız adres ve iletişim bilgileriniz sonraki alışverişlerde otomatik dolar, siparişlerinizi "Hesabım" bölümünden takip edebilirsiniz.`
      },
      {
        q: 'Şifremi unuttum, ne yapmalıyım?',
        a: `Giriş sayfasındaki "Şifremi unuttum" bağlantısına tıklayın, e-posta adresinizi girin. Size şifre yenileme bağlantısı gönderilir.`
      },
      {
        q: 'Kişisel verilerim nasıl korunuyor?',
        a: `Verileriniz KVKK'ya uygun olarak işlenir; ayrıntılar KVKK Aydınlatma Metni'nde yer alır. "Hesabım > Veri Talebi" bölümünden verilerinizin bir kopyasını indirebilir veya hesabınızın silinmesini talep edebilirsiniz.`
      }
    ]
  }
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: SECTIONS.flatMap((s) =>
    s.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a }
    }))
  )
};

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />

      <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-2">Sıkça Sorulan Sorular</h1>
      <p className="text-sm text-carbon/60 mb-8">
        Aradığınız yanıtı bulamazsanız{' '}
        <a href={`tel:+90${LEGAL.telefon.replace(/\D/g, '').replace(/^0/, '')}`} className="text-primary underline">
          {LEGAL.telefon}
        </a>{' '}
        veya{' '}
        <a href={`mailto:${LEGAL.eposta}`} className="text-primary underline">
          {LEGAL.eposta}
        </a>{' '}
        üzerinden bize ulaşın.
      </p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display font-bold text-primary text-lg mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group bg-white rounded-xl border border-primary/10 px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-medium text-sm text-carbon">
                    {item.q}
                    <svg
                      className="shrink-0 text-primary/60 transition-transform group-open:rotate-180"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <p className="text-sm text-carbon/70 leading-relaxed mt-2.5">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 text-sm text-carbon/60">
        İlgili sayfalar:{' '}
        <Link href="/teslimat-ve-kargo" className="text-primary underline">
          Teslimat ve Kargo
        </Link>
        {' · '}
        <Link href="/iptal-iade-kosullari" className="text-primary underline">
          İptal, İade ve Cayma Hakkı
        </Link>
        {' · '}
        <Link href="/mesafeli-satis-sozlesmesi" className="text-primary underline">
          Mesafeli Satış Sözleşmesi
        </Link>
      </div>
    </div>
  );
}
