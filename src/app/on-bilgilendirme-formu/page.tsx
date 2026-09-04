import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Ön Bilgilendirme Formu', robots: { index: true } };

export default function OnBilgilendirmeFormuPage() {
  return (
    <LegalPage title="Ön Bilgilendirme Formu">
      <p>
        Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, sipariş
        vermeden önce sizi bilgilendirmek amacıyla hazırlanmıştır. Siparişi onayladığınızda bu formu ve Mesafeli Satış
        Sözleşmesi&apos;ni okuyup kabul etmiş sayılırsınız.
      </p>

      <h2>1. Satıcı Bilgileri</h2>
      <ul>
        <li>Unvan: {LEGAL.unvan} (&quot;{LEGAL.markaAdi}&quot;) — {LEGAL.isletmeTuru}</li>
        <li>Adres: {LEGAL.adres}</li>
        <li>Telefon: {LEGAL.telefon} · E-posta: {LEGAL.eposta}</li>
        <li>Vergi Dairesi / No: {LEGAL.vergiDairesi} / {LEGAL.vergiNo}</li>
        <li>MERSİS No: {LEGAL.mersisNo} · Ticaret Sicil No: {LEGAL.ticaretSicilNo}</li>
      </ul>

      <h2>2. Ürün / Hizmet Bilgileri</h2>
      <p>
        Sipariş konusu ürünlerin adı, adedi, birim fiyatı, KDV dahil satış fiyatı ve varsa kampanya indirimleri, sipariş
        özeti ekranında ve sipariş onay e-postasında yer alır. Fiyatlara KDV dahildir.
      </p>

      <h2>3. Kargo ve Teslimat</h2>
      <ul>
        <li>Kargo ücreti: {LEGAL.ucretsizKargoEsigiTl} TL üzeri ücretsiz; altında {LEGAL.standartKargoUcretiTl} TL.</li>
        <li>Teslimat süresi: ödeme onayından sonra {LEGAL.teslimatSuresiIsGunu} iş günü içinde kargoya verilir (bkz. <a href="/teslimat-ve-kargo">Teslimat ve Kargo Koşulları</a>).</li>
        <li>Teslimat, siparişte belirtilen adrese {LEGAL.kargoFirmasi} ile yapılır.</li>
      </ul>

      <h2>4. Ödeme</h2>
      <p>
        Ödeme; kredi/banka kartı ile iyzico 3D Secure altyapısı üzerinden veya havale/EFT ile yapılır. Kart bilgileriniz
        iyzico&apos;nun PCI-DSS uyumlu sayfasında girilir, satıcıya iletilmez.
      </p>

      <h2>5. Bilgi Girişi Hatalarının Düzeltilmesi</h2>
      <p>
        Siparişi onaylamadan önce, sepet ve ödeme adımlarında ürün, adet, teslimat/fatura adresi ve iletişim
        bilgilerinizi görüntüleyebilir; yanlış girdiğiniz bir bilgiyi ilgili alandan geri dönerek düzeltebilirsiniz.
        &quot;Ödemeyi Tamamla&quot; adımına kadar hiçbir bilgi kesinleşmez.
      </p>

      <h2>6. Cayma Hakkı</h2>
      <p>
        Ürünü teslim aldığınız tarihten itibaren {LEGAL.caymaSuresiGun} gün içinde, hiçbir gerekçe göstermeden ve cezai
        şart ödemeden cayma hakkınız vardır. Cayma bildirimi, bu süre içinde {LEGAL.eposta} adresine yazılı olarak
        (dilerseniz İptal, İade ve Cayma Hakkı sayfasındaki formla) yapılır.
      </p>
      <p>
        Cayma hakkını kullanırsanız; ürün bedeli <b>ve teslimat sırasında ödemiş olduğunuz standart kargo ücreti
        (varsa)</b>, cayma bildiriminin bize ulaşmasından itibaren en geç 14 gün içinde ödemeyi yaptığınız yönteme
        (kart / havale) iade edilir. Ürünü {LEGAL.kargoFirmasi} ile satıcının adresine geri göndermeniz yeterlidir.
      </p>
      <p>
        <b>Cayma halinde ürünün geri gönderim (iade kargo) masrafı Alıcı&apos;ya aittir.</b> Ayıplı/yanlış/eksik ürün
        gönderiminde ise iade kargo masrafı Satıcı&apos;ya aittir.
      </p>
      <p>
        <b>Cayma hakkının istisnaları:</b> Ambalajı/koruyucu bandı açılmış gıda ürünleri (baharat, çay, bitki, yağ,
        sirke), çabuk bozulabilen veya son kullanma tarihi kısa ürünler, ambalajı açılmış kozmetik/kişisel bakım
        ürünleri ve Alıcı&apos;nın isteğine göre hazırlanan ürünlerde cayma hakkı kullanılamaz. Ayrıntı için{' '}
        <a href="/iptal-iade-kosullari">İptal, İade ve Cayma Hakkı</a> sayfasına bakınız.
      </p>

      <h2>7. Şikâyet ve İtiraz</h2>
      <p>
        Uyuşmazlık durumunda, Ticaret Bakanlığı&apos;nca her yıl ilan edilen parasal sınırlar dahilinde tüketicinin
        yerleşim yerindeki veya işlemin yapıldığı yerdeki <b>Tüketici Hakem Heyeti</b>&apos;ne, bu sınırı aşan
        uyuşmazlıklarda <b>Tüketici Mahkemesi</b>&apos;ne başvurabilirsiniz. Ayrıca talep ve şikâyetlerinizi{' '}
        {LEGAL.eposta} veya {LEGAL.telefon} üzerinden doğrudan bize iletebilirsiniz.
      </p>

      <h2>8. Sağlık Beyanı</h2>
      <p>
        Sitede satılan bitkisel ürünler gıda/takviye amaçlıdır; ilaç değildir, hastalıkların teşhis, tedavi veya
        önlenmesi amacıyla kullanılmaz. Sağlık sorununuz varsa hekiminize danışınız.
      </p>
    </LegalPage>
  );
}
