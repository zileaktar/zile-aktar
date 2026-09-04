import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'KVKK Aydınlatma Metni', robots: { index: true } };

export default function KvkkPage() {
  return (
    <LegalPage title="Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni">
      <p>
        {LEGAL.unvan} (&quot;Veri Sorumlusu&quot; / &quot;{LEGAL.markaAdi}&quot;) olarak, 6698 sayılı Kişisel Verilerin
        Korunması Kanunu (&quot;KVKK&quot;) kapsamında, {LEGAL.webAdresi} üzerinden yürüttüğümüz faaliyetlerde kişisel
        verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <ul>
        <li>Unvan: {LEGAL.unvan} (&quot;{LEGAL.markaAdi}&quot;) — {LEGAL.isletmeTuru}</li>
        <li>Adres: {LEGAL.adres}</li>
        <li>E-posta: {LEGAL.eposta} · Telefon: {LEGAL.telefon}</li>
        <li>Vergi Dairesi / No: {LEGAL.vergiDairesi} / {LEGAL.vergiNo}</li>
        <li>MERSİS No: {LEGAL.mersisNo} · Ticaret Sicil No: {LEGAL.ticaretSicilNo}</li>
      </ul>

      <h2>2. İşlenen Kişisel Veriler</h2>
      <ul>
        <li><b>Kimlik:</b> ad-soyad; kartla ödemede T.C. Kimlik No (yalnızca ödeme kuruluşuna iletmek için).</li>
        <li><b>İletişim:</b> e-posta, telefon, teslimat ve fatura adresi.</li>
        <li><b>Müşteri işlem:</b> sipariş geçmişi, sepet, ürün yorumları, talep/şikayet kayıtları.</li>
        <li><b>İşlem güvenliği:</b> IP adresi, oturum çerezleri, hız sınırlama kayıtları.</li>
        <li><b>Finansal:</b> ödeme işlem referansları, sipariş tutarları. <b>Kart numarası, son kullanma tarihi ve CVV bilgisi tarafımızca HİÇ toplanmaz ve saklanmaz</b> — bu veriler doğrudan iyzico&apos;nun PCI-DSS uyumlu altyapısında işlenir.</li>
        <li>
          <b>Pazarlama / analitik:</b> <b>yalnızca çerez banner&apos;ında &quot;Tümünü Kabul Et&quot; seçmeniz halinde</b>, site
          kullanım istatistikleri, ziyaret edilen sayfalar, tıklama ve sepete ekleme gibi davranışsal veriler (Google
          Analytics ve Meta Pixel aracılığıyla). &quot;Yalnızca Zorunlu&quot; seçilirse bu araçlar hiç yüklenmez.
        </li>
      </ul>

      <h2>3. İşleme Amaçları</h2>
      <ul>
        <li>Siparişin oluşturulması, hazırlanması ve teslim edilmesi</li>
        <li>Ödeme işleminin gerçekleştirilmesi ve doğrulanması (iyzico)</li>
        <li>Fatura düzenleme ve yasal saklama yükümlülükleri (Vergi Usul Kanunu, Türk Ticaret Kanunu)</li>
        <li>Müşteri destek taleplerinin karşılanması, iade/cayma süreçleri</li>
        <li>Site güvenliği, dolandırıcılık ve kötüye kullanımın önlenmesi</li>
        <li>Açık rızanız olması halinde kampanya ve fırsat bildirimleri</li>
      </ul>

      <h2>4. Hukuki Sebepler (KVKK m.5)</h2>
      <p>
        Verileriniz; sözleşmenin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi, bir hakkın tesisi/korunması
        ve veri sorumlusunun meşru menfaati hukuki sebeplerine dayanılarak; pazarlama iletişimi ise yalnızca açık rızanıza
        dayanılarak işlenir.
      </p>

      <h2>5. Aktarım Yapılan Taraflar</h2>
      <p>Verileriniz, hizmetin sağlanabilmesi için gerekli olduğu ölçüde aşağıdaki tedarikçilerle paylaşılır:</p>
      <ul>
        <li><b>{LEGAL.kargoFirmasi}</b> (sipariş teslimatı) — Türkiye</li>
        <li><b>iyzico / iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş.</b> (ödeme) — Türkiye</li>
        <li><b>Supabase</b> (veritabanı, kimlik doğrulama, dosya depolama) — AB (Frankfurt)</li>
        <li><b>Brevo (Sendinblue)</b> (işlem e-postaları) — AB</li>
        <li><b>Vercel</b> (site barındırma), <b>Cloudflare</b> (bot koruması / Turnstile), <b>Sentry</b> (hata izleme), <b>Upstash</b> (hız sınırlama)</li>
        <li>
          Yalnızca çerez izni verdiyseniz: <b>Google (Google Analytics)</b> ve <b>Meta Platforms (Facebook Pixel)</b> —
          site kullanım istatistikleri ve reklam ölçümü amacıyla; sunucuları yurt dışındadır.
        </li>
        <li>Yetkili kamu kurum ve kuruluşları (yasal talep halinde)</li>
      </ul>
      <p>
        Yurt dışında sunucusu bulunan sağlayıcılara (Supabase, Brevo, Vercel, Cloudflare, Sentry, Upstash, Google, Meta)
        aktarım; KVKK m.9 uyarınca, sözleşmenin ifası için gerekli olması ve/veya açık rızanız (pazarlama/analitik çerezleri)
        hukuki sebeplerine dayanılarak, yeterli koruma sağlayan taahhütler çerçevesinde yapılır.
      </p>

      <h2>6. Saklama Süreleri</h2>
      <ul>
        <li>Hesap ve iletişim verileri: hesabınız aktif olduğu sürece; hesap silindiğinde silinir/anonimleştirilir.</li>
        <li>Sipariş ve fatura kayıtları: ilgili mevzuat gereği <b>10 yıl</b> (kişisel bağlantı hesap silinince kesilir, mali kayıt bütünlüğü için saklanır).</li>
        <li>Site güvenliği/log kayıtları: en fazla 1 yıl.</li>
        <li>Pazarlama izni: izni geri çekene kadar.</li>
      </ul>

      <h2>7. Haklarınız (KVKK m.11)</h2>
      <p>
        Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını
        öğrenme, düzeltilmesini/silinmesini isteme, işlemenin sınırlandırılmasını isteme ve verilerinizi taşınabilir
        formatta talep etme haklarına sahipsiniz. Bu hakları{' '}
        <a href="/hesabim/veri-talebi">Hesabım → KVKK Veri Talebi</a> sayfasından kendiniz kullanabilir veya{' '}
        {LEGAL.eposta} adresine yazılı olarak başvurabilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılır.
        Ayrıca Kişisel Verileri Koruma Kurumu&apos;na şikâyette bulunma hakkınız saklıdır.
      </p>

      <h2>8. Çerezler</h2>
      <p>
        Sitemizde <b>zorunlu</b> çerezler (oturum, sepet, güvenlik — izin gerektirmez) ve yalnızca açık rızanızla çalışan{' '}
        <b>analitik / pazarlama</b> çerezleri (Google Analytics, Meta Pixel) kullanılır. Çerez banner&apos;ından
        tercihinizi belirleyebilir, &quot;Yalnızca Zorunlu&quot; seçerek analitik/pazarlama çerezlerini devre dışı
        bırakabilirsiniz. Ayrıntı için <a href="/cerez-politikasi">Çerez Politikası</a> sayfamıza bakınız.
      </p>
    </LegalPage>
  );
}
