import Link from 'next/link';
import { SiteLogo } from '@/components/layout/SiteLogo';

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
                <Link href={`/?kategori=${cat.slug}`} className="hover:text-accent-light">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">İletişim</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            <li>📍 Dutlupınar, Cumhuriyet Cd. Kültür Sitesi D:26/G, 60400 Zile/Tokat</li>
            <li>
              📞{' '}
              <a href="tel:+905511730094" className="hover:text-cream">
                0551 173 00 94
              </a>
            </li>
            <li>
              💬{' '}
              <a href="https://wa.me/905511730094" target="_blank" rel="noopener noreferrer" className="hover:text-cream">
                WhatsApp
              </a>
            </li>
            <li>✉️ zileaktar@gmail.com</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Güvenli Alışveriş</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">🔒 SSL 256-bit</span>
            <span className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold">✅ 3D Secure</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['VISA', 'Mastercard', 'Troy', 'iyzico'].map((b) => (
              <span key={b} className="bg-white text-carbon rounded px-2.5 py-1.5 text-[11px] font-bold">
                {b}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-1 mt-4 text-xs text-cream/50">
            <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-accent-light">
              Mesafeli Satış Sözleşmesi
            </Link>
            <Link href="/kvkk" className="hover:text-accent-light">
              KVKK Aydınlatma Metni
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream/45">
        © {new Date().getFullYear()} Zile Aktar — Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
