import Image from 'next/image';
import { getProductImageUrl } from '@/lib/media';

interface SiteLogoProps {
  logoPath: string | null;
  size?: number;
  /** Görsel yüklenmemişse gösterilen 🌿 daire için arka plan/metin renk sınıfı. */
  fallbackClassName?: string;
}

/**
 * Üst menü, alt bilgi ve mobil çekmecede aynı logo mantığını tekrarlamamak
 * için ortak bileşen: admin panelinden bir logo yüklendiyse onu gösterir
 * (bkz. /admin/ayarlar), yüklenmediyse markanın orijinal 🌿 rozetine döner.
 */
export function SiteLogo({ logoPath, size = 40, fallbackClassName = 'bg-primary text-accent-light' }: SiteLogoProps) {
  if (logoPath) {
    return (
      <span className="relative shrink-0 rounded-full overflow-hidden bg-white" style={{ width: size, height: size }}>
        <Image src={getProductImageUrl(logoPath)} alt="Zile Aktar" fill className="object-contain" />
      </span>
    );
  }

  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 ${fallbackClassName}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      🌿
    </span>
  );
}
