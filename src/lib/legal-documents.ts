/**
 * SİPARİŞE ÖZEL Ön Bilgilendirme Formu (ÖBF) ve Mesafeli Satış Sözleşmesi (MSS).
 *
 * 6502 s. Kanun m.48 + Mesafeli Sözleşmeler Yönetmeliği (MSY) m.5-7:
 *  - ÖBF, sözleşme kurulmadan ÖNCE siparişin gerçek bilgileriyle (ürünler, toplam
 *    fiyat, kargo, ödeme şekli) gösterilir → ödeme sayfasındaki "siparişinize özel
 *    görüntüle" alanı bu fonksiyonla çizilir.
 *  - Sözleşme kurulunca ÖBF + MSS "kalıcı veri saklayıcısı" ile (e-posta) tüketiciye
 *    gönderilir; satıcı bu belgeleri en az 3 yıl saklar (MSY m.20) → sipariş anında
 *    üretilen HTML `order_legal_documents` tablosuna DEĞİŞTİRİLEMEZ şekilde yazılır
 *    (migration 0044) ve e-postayla gönderilir.
 *
 * Bu dosya SAF fonksiyonlardan oluşur (sunucu/istemci ortak) — veritabanına veya
 * gizli anahtarlara dokunmaz. Kullanıcı girdisi her yerde HTML-escape edilir.
 *
 * Metin değişirse `LEGAL_DOCS_VERSION`'ı güncelleyin: arşivdeki her kayıt hangi
 * sürümle üretildiğini saklar. Genel sayfalar (/on-bilgilendirme-formu,
 * /mesafeli-satis-sozlesmesi) ile içerik paralel tutulmalı.
 */
import { LEGAL } from '@/lib/legal';
import { formatDateTimeTR, formatPriceFromCents } from '@/lib/format';

export const LEGAL_DOCS_VERSION = '2026-11-20';

export interface LegalDocAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
}

export interface LegalDocItem {
  name: string;
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
}

export interface LegalDocInput {
  /** Önizlemede (sipariş henüz oluşmadı) null. */
  orderNumber: string | null;
  orderDate: Date | string;
  buyerEmail: string;
  shippingAddress: LegalDocAddress;
  billingAddress: LegalDocAddress | null;
  items: LegalDocItem[];
  subtotalCents: number;
  dealDiscountCents: number;
  couponDiscountCents: number;
  couponCode: string | null;
  /** Önizlemede kargo ücreti henüz hesaplanmadıysa null. */
  shippingCents: number | null;
  totalCents: number;
  paymentMethod: 'card' | 'havale';
}

export type LegalDocType = 'preliminary_info' | 'distance_sales';

export const LEGAL_DOC_TITLES: Record<LegalDocType, string> = {
  preliminary_info: 'Ön Bilgilendirme Formu',
  distance_sales: 'Mesafeli Satış Sözleşmesi'
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;
const H2 = 'style="font-size:15px;color:#1b4332;margin:18px 0 6px"';
const P = 'style="font-size:13px;line-height:1.55;margin:6px 0"';
const TD = 'style="padding:4px 6px;border-bottom:1px solid #eee;font-size:13px"';
const TDR = 'style="padding:4px 6px;border-bottom:1px solid #eee;font-size:13px;text-align:right;white-space:nowrap"';

function sellerBlock(): string {
  const lines = [
    `Unvan: ${e(LEGAL.unvan)} ("${e(LEGAL.markaAdi)}") — ${e(LEGAL.isletmeTuru)}`,
    `Adres: ${e(LEGAL.adres)}`,
    `Telefon: ${e(LEGAL.telefon)} · E-posta: ${e(LEGAL.eposta)}${LEGAL.kepAdresi ? ` · KEP: ${e(LEGAL.kepAdresi)}` : ''}`,
    `Vergi Dairesi / No: ${e(LEGAL.vergiDairesi)} / ${e(LEGAL.vergiNo)}`,
    `MERSİS No: ${e(LEGAL.mersisNo)} · Ticaret Sicil No: ${e(LEGAL.ticaretSicilNo)}`,
    `Web: ${e(LEGAL.webAdresi)}`
  ];
  if (LEGAL.meslekOdasi) lines.push(`Kayıtlı olunan meslek odası: ${e(LEGAL.meslekOdasi)}`);
  return `<p ${P}>${lines.join('<br>')}</p>`;
}

function addressLine(a: LegalDocAddress): string {
  return `${e(a.addressLine)}, ${e(a.district)} / ${e(a.city)}`;
}

function buyerBlock(input: LegalDocInput): string {
  const s = input.shippingAddress;
  const b = input.billingAddress ?? s;
  return `<p ${P}>Ad Soyad: ${e(s.fullName)}<br>
Teslimat adresi: ${addressLine(s)}<br>
Telefon: ${e(s.phone)} · E-posta: ${e(input.buyerEmail)}<br>
Fatura bilgileri: ${e(b.fullName)} — ${addressLine(b)}</p>`;
}

function itemsAndTotals(input: LegalDocInput): string {
  const rows = input.items
    .map(
      (i) =>
        `<tr><td ${TD}>${e(i.name)} <span style="color:#777">(${e(i.variantLabel)})</span></td><td ${TDR}>${i.quantity}</td><td ${TDR}>${formatPriceFromCents(
          i.unitPriceCents
        )}</td><td ${TDR}>${formatPriceFromCents(i.unitPriceCents * i.quantity)}</td></tr>`
    )
    .join('');
  const extra: string[] = [];
  extra.push(`<tr><td ${TD} colspan="3">Ara toplam (KDV dahil)</td><td ${TDR}>${formatPriceFromCents(input.subtotalCents)}</td></tr>`);
  if (input.dealDiscountCents > 0)
    extra.push(`<tr><td ${TD} colspan="3">Kampanya indirimi</td><td ${TDR}>-${formatPriceFromCents(input.dealDiscountCents)}</td></tr>`);
  if (input.couponDiscountCents > 0)
    extra.push(
      `<tr><td ${TD} colspan="3">İndirim kodu${input.couponCode ? ` (${e(input.couponCode)})` : ''}</td><td ${TDR}>-${formatPriceFromCents(
        input.couponDiscountCents
      )}</td></tr>`
    );
  extra.push(
    `<tr><td ${TD} colspan="3">Kargo / teslimat ücreti</td><td ${TDR}>${
      input.shippingCents === null ? 'hesaplanıyor' : input.shippingCents === 0 ? 'Ücretsiz' : formatPriceFromCents(input.shippingCents)
    }</td></tr>`
  );
  extra.push(
    `<tr><td ${TD} colspan="3"><b>TOPLAM (tüm vergiler dahil)</b></td><td ${TDR}><b>${formatPriceFromCents(input.totalCents)}</b></td></tr>`
  );
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0">
<tr><th ${TD} align="left">Ürün</th><th ${TDR}>Adet</th><th ${TDR}>Birim fiyat</th><th ${TDR}>Tutar</th></tr>
${rows}${extra.join('')}</table>`;
}

function paymentText(m: LegalDocInput['paymentMethod']): string {
  return m === 'havale'
    ? 'Havale/EFT. Ödeme, sipariş numarası açıklamaya yazılarak Satıcı&apos;nın banka hesabına yapılır; ödeme hesaba geçince sipariş hazırlanır.'
    : 'Kredi/banka kartı ile tek çekim — VakıfBank 3D Secure altyapısı. Kart bilgileri VakıfBank&apos;ın PCI-DSS uyumlu sayfasında girilir, Satıcı&apos;ya iletilmez ve saklanmaz.';
}

function header(title: string, input: LegalDocInput): string {
  const ref = input.orderNumber ? `Sipariş No: <b>${e(input.orderNumber)}</b> · ` : 'Sipariş özeti (önizleme) · ';
  return `<h1 style="font-size:18px;color:#1b4332;margin:0 0 4px">${title}</h1>
<p style="font-size:12px;color:#666;margin:0 0 10px">${ref}Tarih: ${e(formatDateTimeTR(input.orderDate))} · Metin sürümü: ${LEGAL_DOCS_VERSION}</p>`;
}

function withdrawalText(): string {
  const c = LEGAL.iadeKargoFirmasi;
  return `<p ${P}>Alıcı, ürünü teslim aldığı tarihten itibaren <b>${LEGAL.caymaSuresiGun} gün</b> içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilir. Cayma bildirimi bu süre içinde ${e(
    LEGAL.eposta
  )} adresine yazılı olarak (veya ${e(LEGAL.webAdresi)}/iptal-iade-kosullari sayfasındaki formla) yapılır.</p>
<p ${P}>Cayma hâlinde Satıcı, bildirimin kendisine ulaşmasından itibaren en geç 14 gün içinde ürün bedeli ile teslimat masrafları dahil tahsil edilen tüm bedeli, ödemenin yapıldığı yönteme iade eder. Alıcı ürünü, cayma bildiriminden itibaren 10 gün içinde Satıcı&apos;nın adresine geri gönderir.</p>
<p ${P}>İade için belirlenen taşıyıcı <b>${e(c)}</b>&apos;dır; ürün bu taşıyıcı ile Satıcı&apos;nın ileteceği anlaşmalı iade koduyla gönderildiğinde <b>Alıcı iade kargo ücreti ödemez</b>. Alıcı&apos;nın bulunduğu yerde ${e(
    c
  )} şubesi yoksa Satıcı, ek masraf talep etmeden ürünün Alıcı&apos;dan teslim alınmasını sağlar. Alıcı&apos;nın kendi tercihiyle başka taşıyıcı kullanması hâlinde o gönderimin masrafı Alıcı&apos;ya aittir. Ayıplı, yanlış veya eksik ürün iadelerinde hiçbir masraf Alıcı&apos;dan istenmez.</p>
<p ${P}><b>Cayma hakkının kullanılamadığı durumlar (MSY m.15):</b> ambalajı/koruyucu bandı açılmış gıda ürünleri (baharat, çay, bitki, yağ, sirke), çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler, sağlık ve hijyen açısından iadesi uygun olmayan ambalajı açılmış kozmetik/kişisel bakım ürünleri ile Alıcı&apos;nın isteğine göre hazırlanan ürünler.</p>`;
}

function disputeText(): string {
  return `<p ${P}>Uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca her yıl ilan edilen parasal sınırlar dahilinde Alıcı&apos;nın yerleşim yerindeki veya işlemin yapıldığı yerdeki <b>Tüketici Hakem Heyeti</b>&apos;ne; bu sınırı aşan uyuşmazlıklarda 6502 s. Kanun m.73/A uyarınca dava öncesi <b>arabuluculuğa</b> başvurulması şartıyla <b>Tüketici Mahkemesi</b>&apos;ne başvurulabilir. Şikâyetler ${e(
    LEGAL.eposta
  )} veya ${e(LEGAL.telefon)} üzerinden de iletilebilir.</p>`;
}

const HEALTH = `<p ${P}>Satılan bitkisel ürünler gıda/gıda takviyesi niteliğindedir; ilaç değildir, hastalıkların teşhis, tedavi veya önlenmesi amacıyla kullanılmaz. Sağlık sorununuz varsa hekiminize danışınız.</p>`;

function wrap(body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:680px">${body}</div>`;
}

/** Siparişe özel Ön Bilgilendirme Formu (HTML). */
export function buildPreliminaryInfoHtml(input: LegalDocInput): string {
  return wrap(`${header('Ön Bilgilendirme Formu', input)}
<p ${P}>Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, sipariş onayından önce Alıcı&apos;yı bilgilendirmek amacıyla düzenlenmiştir. Siparişin onaylanması, Alıcı&apos;ya ödeme yükümlülüğü getirir.</p>
<h2 ${H2}>1. Satıcı</h2>${sellerBlock()}
<h2 ${H2}>2. Alıcı</h2>${buyerBlock(input)}
<h2 ${H2}>3. Ürünler ve Toplam Fiyat</h2>${itemsAndTotals(input)}
<p ${P}>Fiyatlara KDV dahildir. Bu tutar dışında Alıcı&apos;dan ek bir vergi, harç veya ücret talep edilmez.</p>
<h2 ${H2}>4. Ödeme</h2><p ${P}>${paymentText(input.paymentMethod)}</p>
<h2 ${H2}>5. Teslimat</h2><p ${P}>Ürünler, ${
    input.paymentMethod === 'havale' ? 'ödemenin hesaba geçmesinden' : 'ödeme onayından'
  } sonra ${e(LEGAL.teslimatSuresiIsGunu)} iş günü içinde (her hâlükârda 30 günü aşmamak üzere) ${e(
    LEGAL.kargoFirmasi
  )} ile yukarıdaki teslimat adresine gönderilir.</p>
<h2 ${H2}>6. Bilgi Girişi Hatalarının Düzeltilmesi</h2><p ${P}>Alıcı, siparişi onaylamadan önce sepet ve ödeme adımlarında ürün, adet, adres ve iletişim bilgilerini görüntüleyip düzeltebilir.</p>
<h2 ${H2}>7. Cayma Hakkı</h2>${withdrawalText()}
<h2 ${H2}>8. Şikâyet ve Uyuşmazlık</h2>${disputeText()}
<h2 ${H2}>9. Sağlık Beyanı</h2>${HEALTH}`);
}

/** Siparişe özel Mesafeli Satış Sözleşmesi (HTML). */
export function buildDistanceSalesHtml(input: LegalDocInput): string {
  return wrap(`${header('Mesafeli Satış Sözleşmesi', input)}
<h2 ${H2}>1. Taraflar</h2>
<p ${P}><b>SATICI</b></p>${sellerBlock()}
<p ${P}><b>ALICI</b></p>${buyerBlock(input)}
<h2 ${H2}>2. Konu</h2>
<p ${P}>İşbu sözleşme, Alıcı&apos;nın ${e(LEGAL.webAdresi)} üzerinden elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimine ilişkin olarak 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca tarafların hak ve yükümlülüklerini düzenler.</p>
<h2 ${H2}>3. Sözleşme Konusu Ürünler, Fiyat ve Ödeme</h2>${itemsAndTotals(input)}
<p ${P}>Ödeme şekli: ${paymentText(input.paymentMethod)}</p>
<h2 ${H2}>4. Teslimat</h2>
<p ${P}>Ürünler ${e(LEGAL.teslimatSuresiIsGunu)} iş günü içinde (her hâlükârda 30 günü aşmamak üzere) ${e(
    LEGAL.kargoFirmasi
  )} ile Alıcı&apos;nın yukarıda belirttiği adrese teslim edilir. Satıcı, siparişin ifasının imkânsızlaştığını öğrenirse Alıcı&apos;yı 3 gün içinde bilgilendirir ve tahsil edilen tüm ödemeleri en geç 14 gün içinde iade eder. Ürün Alıcı&apos;dan başka bir kişiye teslim edilecekse, o kişinin teslimatı kabul etmemesinden Satıcı sorumlu tutulamaz.</p>
<h2 ${H2}>5. Cayma Hakkı</h2>${withdrawalText()}
<h2 ${H2}>6. Genel Hükümler</h2>
<p ${P}>Alıcı, sözleşme kurulmadan önce Ön Bilgilendirme Formu&apos;nu okuyup teyit ettiğini kabul eder. Kartla ödemede Alıcı, kartın hukuka aykırı kullanılmadığını beyan eder. Satıcı, sipariş konusu ürünün sağlam, eksiksiz ve siparişte belirtilen niteliklere uygun teslim edilmesinden sorumludur.</p>
<h2 ${H2}>7. Sağlık Beyanı</h2>${HEALTH}
<h2 ${H2}>8. Uyuşmazlıkların Çözümü</h2>${disputeText()}
<h2 ${H2}>9. Yürürlük</h2>
<p ${P}>Alıcı, siparişi onaylamakla işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Satıcı, işbu sözleşme ile Ön Bilgilendirme Formu&apos;nu sipariş tarihinden itibaren en az 3 yıl süreyle saklar ve talep hâlinde Alıcı&apos;ya sunar.</p>`);
}

export function buildOrderLegalDocuments(input: LegalDocInput): Record<LegalDocType, string> {
  return {
    preliminary_info: buildPreliminaryInfoHtml(input),
    distance_sales: buildDistanceSalesHtml(input)
  };
}
