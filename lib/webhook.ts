import { createHmac, timingSafeEqual } from 'node:crypto';

export function validSignature(raw: string, timestamp: string | null, signature: string | null, secret: string, now = Date.now()) {
  if (!timestamp || !/^\d+$/.test(timestamp) || !signature || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const expected = Buffer.from('v1=' + createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex'));
  return signature.split(',').some(value => {
    const actual = Buffer.from(value.trim());
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

export function validPayloadSecret(payload: unknown, secret: string) {
  if (!payload || typeof payload !== 'object') return false;
  const incoming = (payload as { secret?: unknown }).secret;
  if (typeof incoming !== 'string') return false;
  const expected = Buffer.from(secret);
  const actual = Buffer.from(incoming);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type Purchase = { order_id: string; product_id: string; email: string; status: 'paid' | 'refunded' | 'chargedback' };
export function parsePurchases(payload: unknown, allowed: string[]): Purchase[] {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  const { event, data } = payload as { event?: string; data?: unknown };
  if (!event || !['purchase_approved', 'refund', 'chargeback'].includes(event)) return [];
  const rows = Array.isArray(data) ? data : [data];
  return rows.flatMap(row => {
    if (!row || typeof row !== 'object') throw new Error('Invalid order');
    const r = row as { id?: string; product?: { id?: string }; customer?: { email?: string } };
    if (typeof r.product?.id !== 'string') throw new Error('Invalid product');
    if (!allowed.includes(r.product.id)) return [];
    if (typeof r.id !== 'string' || !r.id || typeof r.customer?.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.customer.email)) throw new Error('Invalid order');
    return [{ order_id: r.id, product_id: r.product.id, email: r.customer.email.trim().toLowerCase(), status: event === 'purchase_approved' ? 'paid' : event === 'refund' ? 'refunded' : 'chargedback' }];
  });
}
