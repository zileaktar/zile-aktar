import { test, expect } from '@playwright/test';

/**
 * Ana kullanıcı akışı: ürün listeleme -> sepete ekleme -> checkout formu ->
 * eksik onay kutucuklarıyla gönderim engelleniyor mu.
 *
 * NOT: Bu test, çalışan bir dev/preview sunucusu VE gerçek (veya seed edilmiş
 * test) Supabase verisi gerektirir. CI'da PLAYWRIGHT_BASE_URL + tam ortam
 * değişkenleri (bkz. .env.example) tanımlanmadan bu paket anlamlı çalışmaz.
 */
test.describe('Checkout akışı', () => {
  test('kullanıcı bir ürünü sepete ekleyip checkout sayfasına ulaşabilir', async ({ page }) => {
    await page.goto('/');

    const firstAddToCartButton = page.getByRole('button', { name: 'Sepete Ekle' }).first();
    await expect(firstAddToCartButton).toBeVisible();
    await firstAddToCartButton.click();

    await page.getByLabel('Sepetim').click();
    await expect(page.getByText('Siparişi Tamamla')).toBeVisible();
    await page.getByText('Siparişi Tamamla').click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByText('Güvenli Ödeme')).toBeVisible();
  });

  test('onay kutucukları işaretlenmeden sipariş gönderimi engellenir', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sepete Ekle' }).first().click();
    await page.goto('/checkout');

    await page.fill('input[placeholder="Ad Soyad"]', 'Test Kullanıcı');
    await page.fill('input[placeholder*="Telefon"]', '05551234567');
    await page.fill('input[placeholder="E-posta"]', 'test@example.com');
    await page.fill('input[placeholder="İl"]', 'İstanbul');
    await page.fill('input[placeholder="İlçe"]', 'Kadıköy');
    await page.fill('textarea', 'Örnek Mahallesi Örnek Sokak No:1');

    await page.getByRole('button', { name: /Güvenle Ödemeyi Tamamla/ }).click();

    // HTML5 "required" doğrulaması onay kutucukları işaretlenmeden formun
    // gönderilmesini engeller; sayfa checkout'ta kalmalıdır.
    await expect(page).toHaveURL(/\/checkout/);
  });
});
