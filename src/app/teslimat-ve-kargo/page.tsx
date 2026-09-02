import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Teslimat ve Kargo Koşulları', robots: { index: true } };

export default function TeslimatKargoPage() {
  return (
    <LegalPage title="Teslimat ve Kargo Koşulları">
      <h2>Kargo Ücreti</h2>
      <ul>
        <li>{LEGAL.ucretsizKargoEsigiTl} TL ve üzeri siparişlerde kargo <b>ücretsizdir</b>.</li>
        <li>{LEGAL.ucretsizKargoEsigiTl} TL altındaki siparişlerde kargo ücreti {LEGAL.standartKargoUcretiTl} TL&apos;dir ve ödeme sırasında toplam tutara eklenir.</li>
      </ul>

      <h2>Teslimat Süresi</h2>
      <ul>
        <li>Kart ile ödenen siparişler, ödeme onaylandıktan sonra {LEGAL.teslimatSuresiIsGunu} iş günü içinde kargoya verilir.</li>
        <li>Havale/EFT siparişleri, ödeme hesabımıza geçtikten sonra aynı süre içinde kargoya verilir. Havale açıklamasına sipariş numaranızı yazmanız işlemi hızlandırır.</li>
        <li>Kargo firmasının teslimat süresi, bulunduğunuz bölgeye göre 1–4 iş günü arasında değişir.</li>
        <li>Resmî tatiller, olağanüstü hava koşulları ve kargo firmasından kaynaklı gecikmeler bu sürelere dahil değildir.</li>
      </ul>

      <h2>Kargo Firması ve Takip</h2>
      <p>
        Gönderiler {LEGAL.kargoFirmasi} ile yapılır. Siparişiniz kargoya verildiğinde takip numarası e-posta ile iletilir
        ve &quot;Siparişlerim&quot; sayfasından durumu izleyebilirsiniz.
      </p>

      <h2>Teslim Alırken Dikkat</h2>
      <p>
        Paketi teslim alırken kargo görevlisinin yanında kontrol ediniz. Hasarlı/ezik paketleri <b>tutanak tutturarak</b>{' '}
        teslim almayınız veya kabul etmeyiniz; durumu {LEGAL.iadeIcinIletisim} üzerinden 24 saat içinde bize bildiriniz.
      </p>

      <h2>Teslimat Bölgesi</h2>
      <p>Türkiye&apos;nin tamamına teslimat yapılmaktadır. Yurt dışı gönderim şu an bulunmamaktadır.</p>

      <h2>Adres Hatası</h2>
      <p>
        Yanlış/eksik adres nedeniyle teslim edilemeyen ve tarafımıza iade dönen siparişlerin yeniden gönderim kargo
        ücreti alıcıya aittir.
      </p>
    </LegalPage>
  );
}
