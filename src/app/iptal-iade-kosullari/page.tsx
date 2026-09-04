import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'İptal, İade ve Cayma Hakkı', robots: { index: true } };

export default function IptalIadePage() {
  return (
    <LegalPage title="İptal, İade ve Cayma Hakkı Koşulları">
      <h2>Sipariş İptali</h2>
      <p>
        Siparişiniz <b>kargoya verilmeden önce</b> {LEGAL.iadeIcinIletisim} üzerinden iletişime geçerek ücretsiz iptal
        ettirebilirsiniz. Kart ile yapılan ödemelerde iade, aynı karta 3–10 iş günü içinde yansır (banka süreçlerine
        bağlıdır). Havale/EFT ödemelerinde bildireceğiniz IBAN&apos;a iade yapılır.
      </p>

      <h2>Cayma Hakkı</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği uyarınca, ürünü teslim aldığınız tarihten itibaren{' '}
        <b>{LEGAL.caymaSuresiGun} gün</b> içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayma
        hakkınız vardır. Cayma bildirimini bu süre içinde {LEGAL.eposta} adresine yazılı olarak iletmeniz yeterlidir.
      </p>

      <h2>Cayma Hakkının Kullanılamayacağı Ürünler</h2>
      <p>Aşağıdaki ürünlerde, ilgili mevzuat gereği cayma hakkı kullanılamaz:</p>
      <ul>
        <li>Ambalajı/koruyucu bandı <b>açılmış</b> gıda ürünleri (baharat, çay, bitki, yağ, sirke vb.) — hijyen ve sağlık nedeniyle.</li>
        <li>Çabuk bozulabilen veya son kullanma tarihi geçme ihtimali olan ürünler.</li>
        <li>Kişisel bakım/kozmetik ürünlerinde ambalajı açılmış olanlar.</li>
        <li>Alıcının isteğine göre hazırlanan/kişiselleştirilen ürünler.</li>
      </ul>
      <p>
        Ambalajı <b>açılmamış, kullanılmamış, yeniden satılabilir</b> durumdaki ürünler cayma hakkı kapsamındadır.
      </p>

      <h2>İade Süreci</h2>
      <ol>
        <li>{LEGAL.iadeIcinIletisim} üzerinden iade talebinizi ve sipariş numaranızı bildirin.</li>
        <li>Onay sonrası ürünü, faturası ve tüm aksesuarlarıyla birlikte belirtilen adrese gönderin.</li>
        <li>Ürün tarafımıza ulaşıp kontrol edildikten sonra bedeli, cayma bildiriminden itibaren <b>en geç 14 gün</b> içinde iade edilir.</li>
      </ol>

      <h2>Cayma Bildirim Formu</h2>
      <p>
        Cayma hakkınızı kullanmak için aşağıdaki formu doldurup {LEGAL.eposta} adresine gönderebilirsiniz. Bu formu
        kullanmak zorunda değilsiniz; cayma iradenizi açıkça belirten her yazılı bildirim geçerlidir.
      </p>
      <div className="bg-cream border border-primary/15 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
        {`Kime: ${LEGAL.unvan} ("${LEGAL.markaAdi}")
Adres: ${LEGAL.adres}
E-posta: ${LEGAL.eposta}

Bu formla, aşağıdaki ürün(ler)in satışına ilişkin sözleşmeden cayma hakkımı kullanıyorum:

- Sipariş numarası:
- Sipariş tarihi / teslim alma tarihi:
- Cayılan ürün(ler):
- Ad - Soyad:
- Adres:
- İade edilecek tutarın yatırılacağı IBAN:
- Tarih:
- İmza (kağıt üzerinde gönderiliyorsa):`}
      </div>

      <h2>İade Kargo Ücreti</h2>
      <ul>
        <li>Ayıplı/yanlış/eksik ürün gönderiminde iade kargo ücreti <b>bize</b> aittir (anlaşmalı kargo ile ücretsiz gönderirsiniz).</li>
        <li>Cayma hakkı kapsamındaki (ürün sağlam ama vazgeçtiniz) iadelerde kargo ücreti <b>alıcıya</b> aittir.</li>
      </ul>

      <h2>Ayıplı Ürün</h2>
      <p>
        Teslim aldığınız ürün kırık, bozuk, son kullanma tarihi geçmiş, eksik veya sipariş ettiğinizden farklıysa,
        mümkünse fotoğrafıyla birlikte {LEGAL.iadeIcinIletisim} üzerinden <b>en kısa sürede</b> bize bildirin; ücretsiz
        değişim veya tam iade yapılır. Ayıplı ürünlerde 6502 sayılı Tüketicinin Korunması Hakkında Kanun&apos;dan doğan
        seçimlik haklarınız (ücretsiz onarım, değişim, bedel iadesi, indirim) ve yasal zamanaşımı süreleriniz saklıdır;
        erken bildirim yalnızca sürecin hızlanmasını sağlar, hak kaybına yol açmaz.
      </p>
    </LegalPage>
  );
}
