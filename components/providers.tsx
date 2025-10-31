'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY faltantes.');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

type SupabaseBrowserClient = ReturnType<typeof createClient>;

interface SupabaseContextValue {
  supabase: SupabaseBrowserClient;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      <SWRConfig
        value={{
          fetcher: async (resource, init) => {
            const res = await fetch(resource, init);
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? 'Error al cargar información');
            }
            return res.json();
          }
        }}
      >
        {children}
      </SWRConfig>
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase debe usarse dentro de Providers.');
  }
  return context;
};
