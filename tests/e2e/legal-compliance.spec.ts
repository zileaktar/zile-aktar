import { test, expect } from '@playwright/test';

/**
 * Mevzuat uyumu — uçtan uca kontroller. GERÇEK SİPARİŞ OLUŞTURMAZ:
 * /api/checkout'a giden istekler ya tarayıcıda engellenir ya da sunucu Zod
 * doğrulamasında (create_order'dan ÖNCE) reddedilir.
 *
 * Çalıştırma: npm run build && npm run start  →  npx playwright test tests/e2e/legal-compliance.spec.ts --project=chromium
 */

const LEGAL_PAGES = [
  ['/mesafeli-satis-sozlesmesi', 'Mesafeli Satış Sözleşmesi'],
  ['/on-bilgilendirme-formu', 'Ön Bilgilendirme Formu'],
  ['/iptal-iade-kosullari', 'İptal'],
  ['/kvkk', 'KVKK'],
  ['/cerez-politikasi', 'Çerez']
] as const;

test.describe('Yasal metinler ve footer', () => {
  for (const [path, title] of LEGAL_PAGES) {
    test(`${path} açılıyor ve footer'dan bağlantılı`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
      await expect(page.locator(`footer a[href="${path}"]`)).toHaveCount(1);
    });
  }

  test('footer satıcı künyesini (unvan, VKN, MERSİS, adres) içerir', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('Satıcı:');
    await expect(footer).toContainText('MERSİS');
    await expect(footer).toContainText('VKN');
    await expect(footer).toContainText('Zile / Tokat');
  });

  test('KVKK metni yurt dışı bulut altyapısını (Vercel/Supabase) açıkça belirtir', async ({ page }) => {
    await page.goto('/kvkk');
    const body = page.locator('main');
    await expect(body).toContainText('Vercel');
    await expect(body).toContainText('Supabase');
    await expect(body).toContainText('yurt dışı', { ignoreCase: true });
  });
});

test.describe('Çerez banner', () => {
  test('ilk girişte görünür, "Yalnızca Zorunlu" ile kapanır ve GA/Pixel yüklenmez', async ({ page }) => {
    const trackers: string[] = [];
    page.on('request', (r) => {
      if (/googletagmanager|google-analytics|connect\.facebook\.net/.test(r.url())) trackers.push(r.url());
    });
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: 'Çerez tercihleri' });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Yalnızca Zorunlu' }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Çerez tercihleri' })).toBeHidden();
    expect(trackers).toEqual([]);
    // Rızayı geri alma / değiştirme: footer düğmesi banner'ı yeniden açar.
    await page.getByRole('button', { name: 'Çerez Tercihleri' }).click();
    await expect(page.getByRole('dialog', { name: 'Çerez tercihleri' })).toBeVisible();
  });
});

test.describe('Ödeme onay kutuları', () => {
  test('kutular varsayılan BOŞ gelir; işaretlenmeden sipariş isteği GÖNDERİLMEZ', async ({ page }) => {
    let checkoutCalls = 0;
    await page.route('**/api/checkout', (route) => {
      checkoutCalls++;
      return route.abort();
    });

    await page.goto('/');
    await page.getByRole('dialog', { name: 'Çerez tercihleri' }).getByRole('button', { name: 'Yalnızca Zorunlu' }).click();
    await page.getByRole('button', { name: 'Sepete Ekle' }).first().click();
    await page.goto('/checkout');

    const boxes = page.locator('input[type="checkbox"][required]');
    await expect(boxes).toHaveCount(2);
    await expect(boxes.nth(0)).not.toBeChecked();
    await expect(boxes.nth(1)).not.toBeChecked();

    await page.fill('#chk-fullName', 'Test Kullanıcı');
    await page.fill('#chk-phone', '05551234567');
    await page.fill('#chk-email', 'test@example.com');
    await page.fill('#chk-city', 'İstanbul');
    await page.fill('#chk-district', 'Kadıköy');
    await page.fill('textarea[placeholder="Mahalle, Sokak, No, Daire"]', 'Örnek Mahallesi Örnek Sokak No:1');

    // Siparişe özel ÖBF önizlemesi girilen bilgilerle dolu görünür.
    await page.getByRole('button', { name: /Siparişinize özel Ön Bilgilendirme Formu/ }).click();
    await expect(page.getByText('Sipariş özeti (önizleme)', { exact: false })).toBeVisible();
    await expect(page.locator('text=Test Kullanıcı').first()).toBeVisible();

    // Turnstile yerelde token üretemeyebilir → düğme pasif olabilir; formu doğrudan göndermeyi dene.
    await page.locator('form').first().evaluate((f: HTMLFormElement) => f.requestSubmit());
    await page.waitForTimeout(500);
    expect(checkoutCalls).toBe(0);
    await expect(boxes.nth(0)).toHaveJSProperty('validity.valueMissing', true);
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('sunucu: onaylar false iken /api/checkout 400 döner (sipariş oluşturulmaz)', async ({ request, baseURL }) => {
    const payload = {
      items: [{ variantId: '11111111-1111-1111-1111-111111111111', quantity: 1 }],
      address: {
        fullName: 'Test Kullanıcı',
        phone: '05551234567',
        email: 'test@example.com',
        city: 'İstanbul',
        district: 'Kadıköy',
        addressLine: 'Örnek Mahallesi Örnek Sokak No:1'
      },
      paymentMethod: 'card',
      acceptedDistanceSalesAgreement: false,
      acceptedPreliminaryInfo: false
    };
    const res = await request.post('/api/checkout', { data: payload, headers: { Origin: baseURL! } });
    // 400 = Zod reddi; 503 = satış şalteri kapalı (CHECKOUT_ENABLED=false) — ikisi de sipariş oluşturmaz.
    expect([400, 503]).toContain(res.status());
    if (res.status() === 400) {
      const body = await res.json();
      const fieldErrors = JSON.stringify(body.details);
      expect(fieldErrors).toContain('Mesafeli Satış Sözleşmesi onayı zorunludur.');
      expect(fieldErrors).toContain('Ön Bilgilendirme Formu teyidi zorunludur.');
    }
  });
});
