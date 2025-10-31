import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';
import { searchQuerySchema } from '@/lib/validators';
import type { SearchResponse } from '@/types/search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos', details: parsed.error.format() }, { status: 400 });
  }

  const query = parsed.data;

  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const respond = <T>(body: T, init?: ResponseInit) => applyCookieMutations(NextResponse.json(body, init));

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

  const response = (data ?? fallback) as SearchResponse;

  return respond(response);
}
