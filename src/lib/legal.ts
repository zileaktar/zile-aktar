/**
 * İşletmenin yasal bilgileri — TÜM yasal metin sayfaları buradan okur.
 * Bilgi değişirse (adres, kargo firması, çalışma saati, web adresi vb.) yalnızca
 * burayı güncelle; tüm sayfalar otomatik yansır. `sonGuncelleme`'yi de değiştir.
 */
export const LEGAL = {
  // Gerçek kişilere ait ticari işletme — ticari unvan işletme sahibinin adıdır.
  unvan: 'Suzan EŞAT',
  isletmeTuru: 'Gerçek kişilere ait ticari işletme',
  markaAdi: 'Zile Aktar',
  adres: 'Dutlupınar Mah., Cumhuriyet Cd., Kültür Sitesi D:26/G, 60400 Zile / Tokat',
  telefon: '0551 173 00 94',
  eposta: 'zileaktar@gmail.com',
  webAdresi: 'https://zile-aktar.vercel.app', // domain alınınca güncelle

  // Mağaza çalışma saatleri — gerekirse düzenleyin. İletişim sayfası + Store şemasında kullanılır.
  calismaSaatleri: 'Pazartesi – Cumartesi: 09:00 – 19:00 · Pazar: Kapalı',
  // İletişim mesajlarına dönüş taahhüdü (İletişim sayfasında gösterilir).
  yanitSuresi: 'Mesajlarınıza en geç 1 iş günü içinde dönüş yapıyoruz.',

  vergiDairesi: 'Zile Vergi Dairesi',
  vergiNo: '3801213625', // Vergi Kimlik Numarası (10 hane)
  mersisNo: '2246369545600001',
  ticaretSicilNo: '4076',
  faaliyetKodu: '47.27.04', // NACE ana faaliyet kodu

  // Kargo & teslimat
  kargoFirmasi: 'Aras Kargo',
  ucretsizKargoEsigiTl: 700,
  standartKargoUcretiTl: 39.9,
  teslimatSuresiIsGunu: '1–5',

  // İade / cayma
  caymaSuresiGun: 14,
  iadeIcinIletisim: 'zileaktar@gmail.com veya 0551 173 00 94',

  sonGuncelleme: '2026' // metin güncellendiğinde değiştir
} as const;
