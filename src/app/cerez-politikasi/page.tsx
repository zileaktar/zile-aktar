import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Çerez Politikası', robots: { index: true } };

export default function CerezPolitikasiPage() {
  return (
    <LegalPage title="Çerez (Cookie) Politikası">
      <p>
        {LEGAL.webAdresi} sitesinde, hizmeti sunabilmek ve deneyiminizi iyileştirmek için çerezler ve benzeri teknolojiler
        (localStorage) kullanılmaktadır.
      </p>

      <h2>Kullanılan Çerez Türleri</h2>
      <ul>
        <li>
          <b>Zorunlu çerezler:</b> Oturum yönetimi (Supabase kimlik doğrulama — HttpOnly), alışveriş sepetinin
          hatırlanması (localStorage), CSRF ve bot koruması (Cloudflare Turnstile), hız sınırlama. Bunlar olmadan site
          çalışmaz; devre dışı bırakılamaz.
        </li>
        <li>
          <b>Tercih çerezleri:</b> Çerez bildirimini kapatma tercihiniz, seçtiğiniz kategori/görünüm gibi küçük
          kolaylıklar.
        </li>
        <li>
          <b>Analitik / performans:</b> Sentry, yalnızca bir hata oluştuğunda teşhis amaçlı teknik bilgi toplar; reklam
          amaçlı takip veya üçüncü taraf pazarlama çerezi <b>kullanılmamaktadır</b>.
        </li>
      </ul>

      <h2>Üçüncü Taraf Çerezleri</h2>
      <p>
        Ödeme adımında iyzico&apos;nun, güvenlik doğrulamasında Cloudflare&apos;in kendi çerezleri devreye girebilir. Bu
        çerezler ilgili sağlayıcıların gizlilik politikalarına tabidir.
      </p>

      <h2>Çerezleri Yönetme</h2>
      <p>
        Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezleri engellerseniz
        giriş yapma, sepet ve ödeme gibi işlevler çalışmayabilir.
      </p>

      <h2>İletişim</h2>
      <p>Çerez kullanımıyla ilgili sorularınız için: {LEGAL.eposta}</p>
    </LegalPage>
  );
}
