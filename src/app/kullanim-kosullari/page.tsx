import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Site Kullanım Koşulları', robots: { index: true } };

export default function KullanimKosullariPage() {
  return (
    <LegalPage title="Site Kullanım Koşulları ve Üyelik Sözleşmesi">
      <p>
        {LEGAL.webAdresi} ({LEGAL.markaAdi}) sitesini ziyaret ederek, sipariş vererek veya üye olarak aşağıdaki koşulları
        kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız siteyi kullanmayınız. Site sahibi:{' '}
        {LEGAL.unvan} ({LEGAL.isletmeTuru}).
      </p>

      <h2>1. Üyelik</h2>
      <ul>
        <li>Üye olmak için 18 yaşını doldurmuş ve fiil ehliyetine sahip olmanız gerekir.</li>
        <li>Üyelik ve sipariş sırasında verdiğiniz bilgilerin doğru ve güncel olmasından siz sorumlusunuz.</li>
        <li>Hesap şifrenizin gizliliğinden ve hesabınızdan yapılan tüm işlemlerden siz sorumlusunuz. Yetkisiz kullanım fark ederseniz derhal {LEGAL.eposta} adresine bildirin.</li>
        <li>Hesabınızı istediğiniz zaman &quot;Hesabım &gt; Veri Talebi&quot; üzerinden kapattırabilirsiniz. Kapatma sonrası, yasal saklama yükümlülüğü bulunan sipariş/fatura kayıtları mevzuat süresince tutulur.</li>
      </ul>

      <h2>2. Sipariş, Fiyat ve Stok</h2>
      <ul>
        <li>Tüm fiyatlara KDV dahildir. Kargo ücreti ödeme adımında ayrıca gösterilir.</li>
        <li>Nadiren oluşabilecek belirgin fiyat/açıklama hataları veya stok tükenmesi hâllerinde Satıcı siparişi işleme almadan iptal etme ve tahsil edilen bedeli iade etme hakkını saklı tutar; bu durumda derhal bilgilendirilirsiniz.</li>
        <li>Satıcı, kötüye kullanım şüphesi (sahte bilgi, anormal miktar, ödeme sorunu vb.) taşıyan siparişleri reddedebilir.</li>
        <li>Sipariş süreci, teslimat, cayma ve iade için <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>, <a href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</a> ve <a href="/iptal-iade-kosullari">İptal, İade ve Cayma Hakkı</a> sayfaları esas alınır.</li>
      </ul>

      <h2>3. Fikri Mülkiyet</h2>
      <p>
        Sitedeki tasarım, logo, marka, metin, görsel ve düzenlemeler {LEGAL.markaAdi}&apos;na veya lisans verenlerine
        aittir. Bu içerikler, yazılı izin olmadan kopyalanamaz, çoğaltılamaz, ticari amaçla kullanılamaz veya başka bir
        mecrada yayınlanamaz.
      </p>

      <h2>4. Kullanıcı İçeriği (Ürün Yorumları)</h2>
      <ul>
        <li>Yazdığınız yorumlar yayınlanmadan önce incelenir; hakaret, reklam, kişisel veri, yanıltıcı sağlık iddiası veya hukuka aykırı içerik barındıran yorumlar yayınlanmaz veya kaldırılır.</li>
        <li>Yorum göndererek, bu içeriğin sitede yayınlanması ve tanıtım amacıyla kullanılması için {LEGAL.markaAdi}&apos;na süresiz ve bedelsiz kullanım izni vermiş olursunuz.</li>
        <li>Yorumunuzun içeriğinden siz sorumlusunuz.</li>
      </ul>

      <h2>5. Yasak Kullanımlar</h2>
      <p>Aşağıdaki davranışlar yasaktır ve hesabınızın kapatılması ile hukuki işlem sebebidir:</p>
      <ul>
        <li>Siteye izinsiz erişim, güvenlik açığı arama/istismar etme, hizmeti aksatma girişimleri</li>
        <li>Otomatik veri toplama (bot, scraper), içeriğin toplu kopyalanması</li>
        <li>Sahte hesap/sahte sipariş oluşturma, başkasının ödeme aracını izinsiz kullanma</li>
        <li>Site altyapısına aşırı yük bindiren veya kötü amaçlı yazılım içeren istekler</li>
      </ul>

      <h2>6. Sorumluluğun Sınırlandırılması</h2>
      <ul>
        <li>Ürün açıklamaları ve görselleri özenle hazırlanır; küçük renk/görsel farklılıkları ürünün ayıbı sayılmaz.</li>
        <li>Site, teknik bakım, güncelleme veya sağlayıcı kaynaklı sebeplerle geçici olarak erişime kapanabilir.</li>
        <li>Siteden erişilen üçüncü taraf hizmetlerin (ödeme, kargo takibi, harita vb.) içeriğinden ilgili sağlayıcı sorumludur.</li>
        <li>Bu koşullar, tüketici mevzuatından doğan haklarınızı sınırlamaz; mevzuat ile bu metin çelişirse mevzuat uygulanır.</li>
      </ul>

      <h2>7. Sağlık Beyanı</h2>
      <p>
        Sitede satılan bitkisel ürünler gıda ve gıda takviyesi niteliğindedir; ilaç değildir, hastalıkların teşhis,
        tedavi veya önlenmesi amacıyla kullanılmaz. Bir sağlık sorununuz varsa hekiminize danışın.
      </p>

      <h2>8. Kişisel Veriler</h2>
      <p>
        Kişisel verilerinizin işlenmesi <a href="/kvkk">KVKK Aydınlatma Metni</a> ve <a href="/cerez-politikasi">Çerez
        Politikası</a> kapsamında yürütülür.
      </p>

      <h2>9. Değişiklikler</h2>
      <p>
        {LEGAL.markaAdi}, bu koşulları güncelleme hakkını saklı tutar. Güncel metin her zaman bu sayfada yayınlanır;
        önemli değişikliklerde makul şekilde bilgilendirme yapılır. Değişiklik sonrası siteyi kullanmaya devam etmeniz
        yeni koşulları kabul ettiğiniz anlamına gelir.
      </p>

      <h2>10. Uygulanacak Hukuk ve Uyuşmazlık</h2>
      <p>
        Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Tüketici işlemlerinden doğan uyuşmazlıklarda, Ticaret
        Bakanlığı&apos;nca ilan edilen parasal sınırlar dahilinde tüketicinin yerleşim yerindeki Tüketici Hakem Heyeti,
        aşan hâllerde Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>11. İletişim</h2>
      <p>
        Sorularınız için: {LEGAL.eposta} · {LEGAL.telefon} · {LEGAL.adres}
      </p>
    </LegalPage>
  );
}
