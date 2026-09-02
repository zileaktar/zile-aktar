/**
 * İşletmenin yasal bilgileri — TÜM yasal metin sayfaları buradan okur.
 *
 * ⚠️ KÖŞELİ PARANTEZLİ ([...]) alanlar MUTLAKA doldurulmalıdır. Bunlar yoksa
 * mesafeli satış / ön bilgilendirme mevzuatına uyum eksik kalır. Bilgileri
 * vergi levhası, ticaret sicil gazetesi ve imza sirkülerinden alın.
 */
export const LEGAL = {
  // Ticari unvan (şahıs firması ise "Ad Soyad - Firma Adı", limited ise tam unvan)
  unvan: '[Ticari Unvan — ör. Samet Balaban - Zile Aktar]',
  markaAdi: 'Zile Aktar',
  adres: 'Dutlupınar Mah., Cumhuriyet Cd., Kültür Sitesi D:26/G, 60400 Zile / Tokat',
  telefon: '0551 173 00 94',
  eposta: 'zileaktar@gmail.com',
  webAdresi: 'https://zile-aktar.vercel.app', // domain alınınca güncelle

  vergiDairesi: '[Vergi Dairesi]',
  vergiNo: '[Vergi / T.C. Kimlik No]',
  mersisNo: '[MERSİS No — varsa]',
  ticaretSicilNo: '[Ticaret Sicil No — varsa]',

  // Kargo & teslimat
  kargoFirmasi: '[Anlaşmalı Kargo Firması — ör. Yurtiçi Kargo / Aras Kargo]',
  ucretsizKargoEsigiTl: 150,
  standartKargoUcretiTl: 39.9,
  teslimatSuresiIsGunu: '1–5',

  // İade / cayma
  caymaSuresiGun: 14,
  iadeIcinIletisim: 'zileaktar@gmail.com veya 0551 173 00 94',

  sonGuncelleme: '2026' // metin güncellendiğinde değiştir
} as const;
