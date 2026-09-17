import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { parsePurchases, validSignature } from '../lib/webhook.ts';

const now = Date.now();
const timestamp = String(Math.floor(now / 1000));
const secret = 'test-only-secret';
const order = { id: 'order-1', product: { id: 'product-1' }, customer: { email: 'Buyer@Example.com' } };
const raw = JSON.stringify({ event: 'purchase_approved', data: order });
const signature = 'v1=' + createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
test('accepts signed payload; rejects tampering, wrong key, missing and expired signatures', () => {
  assert.equal(validSignature(raw, timestamp, signature, secret, now), true);
  assert.equal(validSignature(raw + ' ', timestamp, signature, secret, now), false);
  assert.equal(validSignature(raw, timestamp, signature, 'other-key', now), false);
  assert.equal(validSignature(raw, timestamp, null, secret, now), false);
  assert.equal(validSignature(raw, timestamp, signature, secret, now + 301000), false);
  assert.equal(validSignature(raw, 'NaN', signature, secret, now), false);
});
test('parses V1, V2 and revocation events, normalizing email', () => {
  assert.equal(parsePurchases(JSON.parse(raw), ['product-1'])[0].email, 'buyer@example.com');
  assert.equal(parsePurchases({ event: 'refund', data: [order] }, ['product-1'])[0].status, 'refunded');
  assert.equal(parsePurchases({ event: 'chargeback', data: order }, ['product-1'])[0].status, 'chargedback');
});
test('unknown products and irrelevant events do not grant access', () => {
  assert.deepEqual(parsePurchases(JSON.parse(raw), ['another-product']), []);
  assert.deepEqual(parsePurchases({ event: 'pix_gerado', data: order }, ['product-1']), []);
  assert.throws(() => parsePurchases({ event: 'purchase_approved', data: { ...order, customer: {} } }, ['product-1']));
});
