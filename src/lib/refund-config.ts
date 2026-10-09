/**
 * Kartla ödenmiş siparişin iadesi siteden (VakıfBank Vposreq API) mi yapılsın?
 *
 * KAPALI (false): VakıfBank iptal/iade servisi (`apigw.vakifbank.com.tr`) isteği
 * yalnızca bankaya ÖNCEDEN BİLDİRİLMİŞ sabit bir sunucu IP'sinden kabul ediyor
 * (hata 6011 "Geçersiz iş yeri IP adresi"). Vercel fonksiyonlarının sabit IP'si yok
 * (Vercel Static IPs ayda 100 $ — mağaza sahibi istemedi, 9 Ekim 2026). Bu yüzden
 * iade VakıfBank SANAL POS PANELİNDEN yapılır; sitedeki düğme yalnızca siparişi
 * "İade Edildi" olarak kapatır (stok + müşteri e-postası).
 *
 * Sabit IP alınıp bankaya tanıtılırsa `true` yapın — otomatik iptal/iade kodu
 * (src/lib/order-cancel.ts) yerinde duruyor.
 */
export const CARD_REFUND_VIA_BANK_API = false;
