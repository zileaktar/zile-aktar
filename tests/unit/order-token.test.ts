import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.mjs', () => ({
  env: { CRON_SECRET: 'test-cron-secret-en-az-16-karakter' }
}));

import { signOrderNumber, verifyOrderNumber } from '@/lib/order-token';

describe('order-token', () => {
  it('imza deterministiktir ve doğrulanır', () => {
    const t = signOrderNumber('KA-260101-123456');
    expect(t).toMatch(/^[0-9a-f]{24}$/);
    expect(verifyOrderNumber('KA-260101-123456', t)).toBe(true);
  });

  it('farklı sipariş numarası / bozuk token doğrulanmaz', () => {
    const t = signOrderNumber('KA-260101-123456');
    expect(verifyOrderNumber('KA-260101-999999', t)).toBe(false);
    expect(verifyOrderNumber('KA-260101-123456', 'sahte')).toBe(false);
    expect(verifyOrderNumber('KA-260101-123456', undefined)).toBe(false);
    expect(verifyOrderNumber(undefined, t)).toBe(false);
  });
});
