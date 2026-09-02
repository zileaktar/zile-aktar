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
        <li>Unvan: {LEGAL.unvan}</li>
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

      <h2>5. Cayma Hakkı</h2>
      <p>
        Ürünü teslim aldığınız tarihten itibaren {LEGAL.caymaSuresiGun} gün içinde cayma hakkınız vardır. Ambalajı açılmış
        gıda/kozmetik ürünlerinde ve çabuk bozulabilen ürünlerde bu hak kullanılamaz. Ayrıntı için{' '}
        <a href="/iptal-iade-kosullari">İptal, İade ve Cayma Hakkı</a> sayfasına bakınız. Cayma bildirimi{' '}
        {LEGAL.eposta} adresine yapılır.
      </p>

      <h2>6. Şikâyet ve İtiraz</h2>
      <p>
        Uyuşmazlık durumunda, Ticaret Bakanlığı&apos;nca ilan edilen parasal sınırlar dahilinde, tüketicinin yerleşim
        yerindeki <b>Tüketici Hakem Heyeti</b> veya <b>Tüketici Mahkemesi</b>&apos;ne başvurabilirsiniz.
      </p>

      <h2>7. Sağlık Beyanı</h2>
      <p>
        Sitede satılan bitkisel ürünler gıda/takviye amaçlıdır; ilaç değildir, hastalıkların teşhis, tedavi veya
        önlenmesi amacıyla kullanılmaz. Sağlık sorununuz varsa hekiminize danışınız.
      </p>
    </LegalPage>
  );
}
