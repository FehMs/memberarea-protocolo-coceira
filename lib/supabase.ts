import { createClient } from '@supabase/supabase-js';

export const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
let client: ReturnType<typeof createClient> | undefined;
export function browserDb() {
  if (!configured) throw new Error('A área de membros ainda está sendo configurada.');
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}
