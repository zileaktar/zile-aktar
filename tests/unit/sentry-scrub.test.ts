import { describe, expect, it } from 'vitest';
import { scrubSecrets, scrubSecretString } from '@/lib/sentry-scrub';

// Gerçek olmayan, biçimi uygun sahte bir bot anahtarı.
const FAKE_TOKEN = '1234567890:AAFakeTokenValue_For-Testing_Only123';

describe('sentry-scrub', () => {
  it('Telegram bot anahtarını adresin içinden maskeler', () => {
    const url = `https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`;
    const scrubbed = scrubSecretString(url);
    expect(scrubbed).toBe('https://api.telegram.org/bot[GIZLENDI]/sendMessage');
    expect(scrubbed).not.toContain('AAFake');
  });

  it('iç içe olay nesnelerindeki (breadcrumb/span) tüm string alanları maskeler', () => {
    const event = {
      breadcrumbs: [{ category: 'fetch', data: { url: `https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`, status_code: 200 } }],
      spans: [{ description: `POST https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`, data: { 'http.url': `bot${FAKE_TOKEN}` } }]
    };
    const scrubbed = scrubSecrets(event);
    expect(JSON.stringify(scrubbed)).not.toContain('AAFake');
    expect(scrubbed.breadcrumbs[0]!.data.status_code).toBe(200);
  });

  it('anahtar içermeyen değerlere dokunmaz', () => {
    const event = { message: 'Sipariş KA-260926-123456 ödendi', count: 3, ok: true, nothing: null };
    expect(scrubSecrets(event)).toEqual(event);
  });
});
