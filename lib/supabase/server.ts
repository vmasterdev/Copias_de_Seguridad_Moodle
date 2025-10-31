import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

type TypedSupabaseClient = SupabaseClient<Database, 'public'>;

const ensureEnv = () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
};

const withCookieStore = (handlers: {
  get: (name: string) => string | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
}): TypedSupabaseClient => {
  const { url, anonKey } = ensureEnv();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: handlers.get,
      set: handlers.set ?? (() => {}),
      remove: handlers.remove ?? (() => {})
    }
  }) as unknown as TypedSupabaseClient;
};

export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return withCookieStore({
    get: (name) => cookieStore.get(name)?.value
  });
};

export const createRouteSupabaseClient = (request: NextRequest) => {
  const cookieMutations: Array<(response: NextResponse) => void> = [];

  const supabase = withCookieStore({
    get: (name) => request.cookies.get(name)?.value,
    set: (name, value, options) => {
      cookieMutations.push((response) => {
        response.cookies.set({ name, value, ...options });
      });
    },
    remove: (name, options) => {
      cookieMutations.push((response) => {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      });
    }
  });

  const applyCookieMutations = <T extends NextResponse>(response: T) => {
    cookieMutations.forEach((mutation) => mutation(response));
    return response;
  };

  return { supabase, applyCookieMutations };
};

export const createServiceRoleClient = () => {
  if (!env.SUPABASE_SERVICE_ROLE) {
    throw new Error('SUPABASE_SERVICE_ROLE no configurada.');
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
    auth: {
      persistSession: false
    }
  });
};
