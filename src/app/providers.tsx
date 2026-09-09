import { CartHydrator } from '@/components/providers/CartHydrator';

/**
 * Uygulama genelinde çalışması gereken client yardımcıları. Şu an yalnızca
 * sepetin localStorage'dan yeniden yüklenmesini (hydration) tetikleyen
 * `CartHydrator` var. (React Query kaldırıldı — veri çekimi tamamen server
 * component'lerde yapılıyor, hiçbir yerde `useQuery` kullanılmıyordu.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartHydrator />
      {children}
    </>
  );
}
