import { createClient } from '@supabase/supabase-js';
import { parsePurchases, validPayloadSecret, validSignature } from '../../../../lib/webhook';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowed = process.env.CAKTO_PRODUCT_IDS?.split(',').map(v => v.trim()).filter(Boolean);
  if (!secret || !url || !key || !allowed?.length) return Response.json({ error: 'Integration unavailable' }, { status: 503 });
  if (Number(request.headers.get('content-length')) > 262144) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 262144) return new Response(null, { status: 413 });
  let payload;
  try { payload = JSON.parse(raw); }
  catch { return Response.json({ error: 'Invalid payload' }, { status: 400 }); }
  const signed = validSignature(raw, request.headers.get('x-cakto-timestamp'), request.headers.get('x-cakto-signature'), secret);
  if (!signed && !validPayloadSecret(payload, secret)) return new Response(null, { status: 401 });
  let purchases;
  try { purchases = parsePurchases(payload, allowed); }
  catch { return Response.json({ error: 'Invalid payload' }, { status: 400 }); }
  if (!purchases.length) return Response.json({ received: true, ignored: true });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.rpc('record_cakto_purchases', { orders: purchases });
  if (error) {
    console.error('cakto_persistence_failed', { code: error.code });
    return Response.json({ error: 'Persistence failed; replay this event from Cakto' }, { status: 500 });
  }
  return Response.json({ received: true });
}
