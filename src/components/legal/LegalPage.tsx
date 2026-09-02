import { LEGAL } from '@/lib/legal';

/** Yasal metin sayfaları için ortak sarmalayıcı — tutarlı başlık, uyarı ve tipografi. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-primary mb-3">{title}</h1>
      <p className="text-[11px] text-carbon/45 mb-8 leading-relaxed">
        ⚠️ Bu metin, işletmenin ihtiyaçlarına göre hazırlanmış bir TASLAKTIR. Yayına almadan önce bir hukuk
        danışmanına onaylatın ve <code>src/lib/legal.ts</code> içindeki köşeli parantezli ([...]) işletme
        bilgilerini (unvan, vergi no, MERSİS, kargo firması vb.) doldurun. Son güncelleme: {LEGAL.sonGuncelleme}.
      </p>
      <div className="space-y-4 text-sm text-carbon/75 leading-relaxed [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:text-base [&_h2]:mt-6 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
