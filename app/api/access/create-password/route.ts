import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validPassword(value: unknown) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}

async function findUserIdByEmail(db: { auth: { admin: { listUsers: (args: { page: number; perPage: number }) => Promise<{ data: { users: { id: string; email?: string }[] }; error: Error | null }> } } }, email: string) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find(item => item.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowed = process.env.CAKTO_PRODUCT_IDS?.split(',').map(v => v.trim()).filter(Boolean) ?? [];
  if (!url || !key || !allowed.length) return Response.json({ error: 'Integration unavailable' }, { status: 503 });

  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }

  const email = normalizeEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validPassword(body.password)) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: purchase, error: purchaseError } = await db
    .from('purchases')
    .select('order_id')
    .eq('email', email)
    .eq('status', 'paid')
    .in('product_id', allowed)
    .limit(1);

  if (purchaseError) {
    console.error('password_access_purchase_lookup_failed', { code: purchaseError.code });
    return Response.json({ error: 'Não foi possível validar seu acesso agora.' }, { status: 500 });
  }

  if (!purchase?.length) {
    return Response.json({ error: 'Não encontramos uma compra aprovada para esse e-mail.' }, { status: 403 });
  }

  try {
    const userId = await findUserIdByEmail(db, email);
    const password = body.password as string;
    const result = userId
      ? await db.auth.admin.updateUserById(userId, { password, email_confirm: true })
      : await db.auth.admin.createUser({ email, password, email_confirm: true });

    if (result.error) throw result.error;
  } catch (error) {
    console.error('password_access_user_setup_failed', { message: error instanceof Error ? error.message : 'unknown' });
    return Response.json({ error: 'Não foi possível criar sua senha agora.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
