import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Mesafeli Satış Sözleşmesi', robots: { index: true } };

export default function DistanceSalesAgreementPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi">
      <h2>1. Taraflar</h2>
      <p>
        <b>SATICI:</b> {LEGAL.unvan} — {LEGAL.adres} — Tel: {LEGAL.telefon} — E-posta: {LEGAL.eposta} — Vergi Dairesi/No:{' '}
        {LEGAL.vergiDairesi}/{LEGAL.vergiNo} — MERSİS: {LEGAL.mersisNo}
      </p>
      <p>
        <b>ALICI:</b> {LEGAL.webAdresi} üzerinden sipariş veren, ad-soyad ve adres bilgilerini sipariş formunda beyan eden
        kişi.
      </p>

      <h2>2. Konu</h2>
      <p>
        İşbu sözleşme, Alıcı&apos;nın Satıcı&apos;ya ait internet sitesinden elektronik ortamda siparişini verdiği,
        nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı
        Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve
        yükümlülüklerini düzenler.
      </p>

      <h2>3. Sözleşme Konusu Ürün ve Ödeme Bilgileri</h2>
      <p>
        Ürünlerin türü, miktarı, marka/modeli, adedi, KDV dahil satış fiyatı ve ödeme şekli, sipariş özeti ekranında ve
        Alıcı&apos;ya gönderilen sipariş onay e-postasında belirtilmiştir. Bu bilgiler işbu sözleşmenin ayrılmaz
        parçasıdır.
      </p>

      <h2>4. Genel Hükümler</h2>
      <ul>
        <li>Alıcı, sipariş öncesi <a href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</a>&apos;nu ve işbu sözleşmeyi okuyup onayladığını kabul eder.</li>
        <li>Ürünler, yasal {LEGAL.teslimatSuresiIsGunu} iş günü süresi içinde (her hâlükârda 30 günü aşmamak üzere) Alıcı&apos;nın belirttiği adrese kargo firması aracılığıyla teslim edilir.</li>
        <li>Ürün, Alıcı&apos;dan başka bir kişiye teslim edilecekse, o kişinin teslimatı kabul etmemesinden Satıcı sorumlu tutulamaz.</li>
        <li>Kargo ücreti: {LEGAL.ucretsizKargoEsigiTl} TL ve üzeri siparişlerde ücretsiz; altında {LEGAL.standartKargoUcretiTl} TL Alıcı&apos;ya aittir.</li>
        <li>Satıcı, mücbir sebepler (doğal afet, salgın, kargo firması kaynaklı aksama vb.) nedeniyle süresinde teslim edemezse Alıcı&apos;yı bilgilendirir; Alıcı siparişi iptal edebilir ve ödediği tutarın tamamı 14 gün içinde iade edilir.</li>
        <li>Ödemenin kredi kartı ile yapılması halinde, Alıcı kartının hukuka aykırı kullanılmadığını kabul eder.</li>
      </ul>

      <h2>5. Cayma Hakkı</h2>
      <p>
        Alıcı, ürünü teslim aldığı tarihten itibaren <b>{LEGAL.caymaSuresiGun} gün</b> içinde, hiçbir gerekçe göstermeksizin
        ve cezai şart ödemeksizin sözleşmeden cayabilir. Cayma bildirimi {LEGAL.eposta} adresine yazılı olarak yapılır.
        Cayma hakkının kullanılması halinde, ürün Satıcı&apos;ya iade edilir ve bedel, cayma bildiriminin ulaşmasından
        itibaren en geç 14 gün içinde Alıcı&apos;ya iade edilir.
      </p>
      <p>
        <b>Cayma hakkının istisnaları:</b> Ambalajı/koruyucu bandı açılmış gıda ürünleri (baharat, çay, bitki, yağ,
        sirke), çabuk bozulabilen ürünler, ambalajı açılmış kozmetik/kişisel bakım ürünleri ve Alıcı&apos;nın isteğine
        göre hazırlanan ürünlerde cayma hakkı kullanılamaz (bkz. <a href="/iptal-iade-kosullari">İptal, İade ve Cayma Hakkı</a>).
      </p>

      <h2>6. Sağlık Beyanı</h2>
      <p>
        Sitede satılan bitkisel ürünler Sağlık Bakanlığı&apos;nca onaylı tıbbi ürünler/ilaçlar değildir; gıda ve gıda
        takviyesi niteliğindedir. Hastalıkların teşhis, tedavi veya önlenmesi amacıyla kullanılmaz.
      </p>

      <h2>7. Yetkili Mahkeme</h2>
      <p>
        İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca ilan edilen değere kadar Alıcı&apos;nın
        veya Satıcı&apos;nın yerleşim yerindeki Tüketici Hakem Heyetleri, aşan durumlarda Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>8. Yürürlük</h2>
      <p>
        Alıcı, sipariş verirken işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme, siparişin Satıcı
        tarafından onaylanmasıyla yürürlüğe girer ve ürünün Alıcı&apos;ya tesliminden sonra sona erer.
      </p>
    </LegalPage>
  );
}
