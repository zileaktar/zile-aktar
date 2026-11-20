import Link from 'next/link';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { CookiePreferencesButton } from '@/components/consent/CookieConsent';
import { LEGAL } from '@/lib/legal';

interface Category {
  slug: string;
  name: string;
}

export function SiteFooter({ categories, logoPath }: { categories: Category[]; logoPath: string | null }) {
  return (
    <footer className="bg-primary-dark text-cream/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <SiteLogo logoPath={logoPath} size={36} fallbackClassName="bg-accent text-primary-dark" />
            <span className="font-display font-bold text-white text-lg">Zile Aktar</span>
          </div>
          <p className="text-sm text-cream/60 leading-relaxed">
            Doğadan gelen şifa, yöresel lezzetlerle sofranızda. Güvenilir aktarlık, 1998&apos;den beri.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Kategoriler</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/kategori/${cat.slug}`} className="hover:text-accent-light">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">İletişim</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            <li>
              📍 {LEGAL.dukkanAdi} — {LEGAL.adres}
            </li>
            <li>
              📞{' '}
              <a href={`tel:+9${LEGAL.telefon.replace(/\D/g, '')}`} className="hover:text-cream">
                {LEGAL.telefon}
              </a>
            </li>
            <li>
              💬{' '}
              <a href="https://wa.me/905511730094" target="_blank" rel="noopener noreferrer" className="hover:text-cream">
                WhatsApp
              </a>
            </li>
            <li>✉️ {LEGAL.eposta}</li>
            {LEGAL.kepAdresi && <li>📨 KEP: {LEGAL.kepAdresi}</li>}
            <li>
              🧭{' '}
              <Link href="/iletisim" className="hover:text-cream underline">
                Harita ve yol tarifi
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Güvenli Alışveriş</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">🔒 SSL 256-bit</span>
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">✅ 3D Secure</span>
          </div>
          {/* Ödeme sağlayıcısı VakıfBank Sanal POS'a geçiş sürecinde — resmi
              logo/marka varlıkları henüz elimizde yok, o yüzden şimdilik düz
              metin rozetleri kullanılıyor. Banka onayı + resmi logo paketi
              gelince buraya gerçek "logo band" görseli eklenecek (kart
              markalarının renkleri için beyaz zemin üzerinde). */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">VakıfBank Sanal POS</span>
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">Visa</span>
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">Mastercard</span>
          </div>
          <div className="flex flex-col gap-1 mt-4 text-xs text-cream/50">
            <Link href="/hakkimizda" className="hover:text-accent-light">
              Hakkımızda
            </Link>
            <Link href="/sss" className="hover:text-accent-light">
              Sıkça Sorulan Sorular
            </Link>
            <Link href="/kullanim-kosullari" className="hover:text-accent-light">
              Site Kullanım Koşulları
            </Link>
            <Link href="/on-bilgilendirme-formu" className="hover:text-accent-light">
              Ön Bilgilendirme Formu
            </Link>
            <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-accent-light">
              Mesafeli Satış Sözleşmesi
            </Link>
            <Link href="/iptal-iade-kosullari" className="hover:text-accent-light">
              İptal, İade ve Cayma Hakkı
            </Link>
            <Link href="/teslimat-ve-kargo" className="hover:text-accent-light">
              Teslimat ve Kargo
            </Link>
            <Link href="/kvkk" className="hover:text-accent-light">
              KVKK Aydınlatma Metni
            </Link>
            <Link href="/cerez-politikasi" className="hover:text-accent-light">
              Çerez Politikası
            </Link>
            <CookiePreferencesButton className="text-left hover:text-accent-light" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 px-4 text-center text-xs text-cream/45 space-y-1">
        {/* 6563 sayılı Kanun m.3 + Ticari İletişim Yönetmeliği m.5: hizmet sağlayıcının
            kimlik bilgileri her sayfadan kolayca ve sürekli erişilebilir olmalı. */}
        <p>
          Satıcı: {LEGAL.unvan} ({LEGAL.markaAdi}) · {LEGAL.vergiDairesi} VKN {LEGAL.vergiNo} · MERSİS{' '}
          {LEGAL.mersisNo} · Ticaret Sicil No {LEGAL.ticaretSicilNo}
          {LEGAL.meslekOdasi && <> · {LEGAL.meslekOdasi}</>}
        </p>
        <p>Adres: {LEGAL.adres} · Tel: {LEGAL.telefon} · E-posta: {LEGAL.eposta}{LEGAL.kepAdresi && <> · KEP: {LEGAL.kepAdresi}</>}</p>
        {/* ETBİS doğrulama alanı — legal.ts'de bağlantı girilince görünür. */}
        {LEGAL.etbisDogrulamaLinki && (
          <p className="pt-2">
            <a
              href={LEGAL.etbisDogrulamaLinki}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-cream"
            >
              {LEGAL.etbisGorselYolu ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={LEGAL.etbisGorselYolu} alt="ETBİS kayıt doğrulama" width={64} height={64} className="bg-white rounded" />
              ) : null}
              <span>ETBİS&apos;e kayıtlıdır</span>
            </a>
          </p>
        )}
        <p>
          © {new Date().getFullYear()} {LEGAL.markaAdi} — Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
