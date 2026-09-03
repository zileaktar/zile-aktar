import type { Metadata } from 'next';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'İletişim',
  description: `Zile Aktar iletişim bilgileri, mağaza adresi ve yol tarifi. ${LEGAL.adres}`,
  alternates: { canonical: '/iletisim' }
};

const telHref = `+90${LEGAL.telefon.replace(/\D/g, '').replace(/^0/, '')}`;
const mapsQuery = encodeURIComponent(`${LEGAL.markaAdi} ${LEGAL.adres}`);
const mapsEmbed = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`;
const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
const mapsOpen = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-2">İletişim</h1>
      <p className="text-sm text-carbon/60 mb-8">{LEGAL.yanitSuresi}</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-primary mb-1.5">Mağaza Adresi</h2>
            <p className="text-sm text-carbon/70 leading-relaxed">{LEGAL.adres}</p>
          </div>

          <div>
            <h2 className="font-semibold text-primary mb-1.5">Çalışma Saatleri</h2>
            <p className="text-sm text-carbon/70">{LEGAL.calismaSaatleri}</p>
          </div>

          <div className="space-y-2 text-sm">
            <h2 className="font-semibold text-primary mb-1.5">Bize Ulaşın</h2>
            <p>
              📞{' '}
              <a href={`tel:${telHref}`} className="text-primary hover:underline">
                {LEGAL.telefon}
              </a>
            </p>
            <p>
              💬{' '}
              <a
                href={`https://wa.me/${telHref.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WhatsApp ile yazın
              </a>
            </p>
            <p>
              ✉️{' '}
              <a href={`mailto:${LEGAL.eposta}`} className="text-primary hover:underline">
                {LEGAL.eposta}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={mapsDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-5 py-2.5 rounded-full transition"
            >
              🧭 Yol Tarifi Al
            </a>
            <a
              href={mapsOpen}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center gap-2 border border-primary/20 text-primary font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-primary/5 transition"
            >
              Google Haritalar&apos;da Aç
            </a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-primary/10 shadow-sm min-h-[280px] md:min-h-full">
          <iframe
            title={`${LEGAL.markaAdi} konumu`}
            src={mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full min-h-[280px]"
          />
        </div>
      </div>
    </div>
  );
}
