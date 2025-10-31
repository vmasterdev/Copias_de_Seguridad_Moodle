import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/auth';
import { backupInsertSchema, searchQuerySchema } from '@/lib/validators';
import { normalizeMetadata } from '@/lib/normalizer';
import type { SearchResponse } from '@/types/search';

const respondWithCookies = (
  applyCookieMutations: ReturnType<typeof createRouteSupabaseClient>['applyCookieMutations']
) => {
  return <T>(body: T, init?: ResponseInit) => applyCookieMutations(NextResponse.json(body, init));
};

export async function GET(request: NextRequest) {
  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const respond = respondWithCookies(applyCookieMutations);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    console.warn('GET /api/backups sin sesión');
  } else {
    console.log('GET /api/backups session user', session.user.id, session.user.email);
  }

  if (!session) {
    return respond({ error: 'No autorizado' }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return respond({ error: 'No autorizado' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    return respond({ error: 'Parámetros inválidos', details: parsed.error.format() }, { status: 400 });
  }

  const query = parsed.data;

  const { data, error } = await supabase.rpc('search_backups', {
    p_search: query.q ?? null,
    p_category: query.category ?? null,
    p_rectoria: query.rectoria ?? null,
    p_sede: query.sede ?? null,
    p_program_code: query.programCode ?? null,
    p_period: query.period ?? null,
    p_year: query.year ?? null,
    p_page: query.page ?? 1,
    p_page_size: query.pageSize ?? 20
  });

  if (error) {
    console.error('search_backups RPC error', error);
    return respond({ error: error.message }, { status: 500 });
  }

  const fallback: SearchResponse = {
    items: [],
    total: 0,
    facets: {
      categories: [],
      rectorias: [],
      sedes: [],
      periods: [],
      programs: []
    }
  };

  return respond(data ?? fallback);
}

export async function POST(request: NextRequest) {
  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const respond = respondWithCookies(applyCookieMutations);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return respond({ error: 'No autorizado' }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return respond({ error: 'No autorizado' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = backupInsertSchema.safeParse(body);

  if (!parsed.success) {
    return respond({ error: 'Payload inválido', details: parsed.error.format() }, { status: 400 });
  }

  const payload = parsed.data;

  const { error: programError } = await supabase
    .from('programs')
    .upsert(
      {
        code: payload.program_code,
        name: payload.program_name,
        rectoria: payload.rectoria,
        sede: payload.sede ?? null
      },
      { onConflict: 'code' }
    );

  if (programError) {
    return respond({ error: programError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('backups')
    .insert({
      ...payload,
      sede: payload.sede ?? null,
      period: payload.period ?? null,
      year: payload.year ?? null,
      size_bytes: payload.size_bytes ?? null,
      checksum: payload.checksum ?? null,
      created_by: session.user.id
    })
    .select()
    .single();

  if (error) {
    return respond({ error: error.message }, { status: 500 });
  }

  return respond({
    backup: data,
    suggestions: normalizeMetadata(payload.file_name)
  });
}
