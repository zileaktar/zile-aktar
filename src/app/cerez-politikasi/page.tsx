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
          kolaylıklar. Ayrıca Sentry, yalnızca bir hata oluştuğunda teşhis amaçlı teknik bilgi toplar.
        </li>
        <li>
          <b>Analitik / pazarlama çerezleri (yalnızca açık rızayla):</b> <b>Google Analytics</b> (site kullanım
          istatistikleri) ve <b>Meta / Facebook Pixel</b> (reklam ölçümü, yeniden pazarlama). Bu çerezler{' '}
          <b>yalnızca çerez banner&apos;ında &quot;Tümünü Kabul Et&quot;</b> seçmeniz halinde yüklenir. &quot;Yalnızca
          Zorunlu&quot; seçerseniz Google ve Meta&apos;ya hiçbir veri gönderilmez. Bu sağlayıcıların sunucuları yurt
          dışındadır.
        </li>
      </ul>

      <h2>Üçüncü Taraf Çerezleri</h2>
      <p>
        Ödeme adımında iyzico&apos;nun, güvenlik doğrulamasında Cloudflare&apos;in kendi çerezleri devreye girebilir.
        Çerez izni vermeniz halinde Google (Analytics) ve Meta (Pixel) çerezleri de kullanılır. Bu çerezler ilgili
        sağlayıcıların gizlilik politikalarına tabidir.
      </p>

      <h2>Çerezleri Yönetme</h2>
      <p>
        Analitik ve pazarlama çerezleri için siteyi ilk açtığınızda gösterilen çerez bildiriminden &quot;Yalnızca
        Zorunlu&quot; veya &quot;Tümünü Kabul Et&quot; seçiminizi yapabilirsiniz. Tercihinizi değiştirmek için
        tarayıcınızın site verilerini (localStorage) temizleyip sayfayı yeniden yükleyin. Ayrıca tarayıcı ayarlarından
        tüm çerezleri silebilir veya engelleyebilirsiniz; ancak zorunlu çerezleri engellerseniz giriş, sepet ve ödeme
        işlevleri çalışmayabilir.
      </p>

      <h2>İletişim</h2>
      <p>Çerez kullanımıyla ilgili sorularınız için: {LEGAL.eposta}</p>
    </LegalPage>
  );
}
