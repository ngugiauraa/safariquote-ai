import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function createLazyClient(factory: () => SupabaseClient): SupabaseClient {
  let client: SupabaseClient | null = null;

  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      if (!client) {
        client = factory();
      }

      return Reflect.get(client, prop, receiver);
    },
  });
}

export const supabase = createLazyClient(() =>
  createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  ),
);

export const supabaseAdmin = createLazyClient(() =>
  createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  ),
);
