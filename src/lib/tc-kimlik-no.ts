/**
 * T.C. Kimlik No doğrulama — Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü'nün
 * yayımladığı resmi checksum algoritması. iyzico'nun ödeme başlatma isteğinde
 * zorunlu tuttuğu `identityNumber` alanı için kullanılır; yalnızca 11 haneli
 * bir dize olması yetmez, aşağıdaki matematiksel kontrolden de geçmelidir —
 * aksi halde rastgele/sahte bir numara (ör. "11111111111") sunucu tarafında
 * kabul edilirdi.
 *
 * Algoritma:
 *  - 1., 3., 5., 7., 9. hanelerin toplamı (tekler) * 7, 2., 4., 6., 8. hanelerin
 *    toplamından (çiftler) çıkarılıp mod 10 alınır -> 10. hane bu olmalı.
 *  - İlk 10 hanenin toplamının mod 10'u -> 11. hane bu olmalı.
 *  - İlk hane 0 olamaz.
 */
export function isValidTcKimlikNo(value: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(value)) return false;

  const digits = value.split('').map(Number);
  const oddSum = digits[0]! + digits[2]! + digits[4]! + digits[6]! + digits[8]!;
  const evenSum = digits[1]! + digits[3]! + digits[5]! + digits[7]!;

  const expectedDigit10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (expectedDigit10 !== digits[9]) return false;

  const sumFirstTen = digits.slice(0, 10).reduce((sum, d) => sum + d, 0);
  const expectedDigit11 = sumFirstTen % 10;
  return expectedDigit11 === digits[10];
}
