import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/auth';
import { buildStorageKey, createUploadUrl } from '@/lib/minio';

export async function GET(request: NextRequest) {
  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const respond = <T>(body: T, init?: ResponseInit) =>
    applyCookieMutations(NextResponse.json(body, init));

  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get('fileName');
  const contentLength = Number(searchParams.get('contentLength') ?? 0);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return respond({ error: 'No autorizado' }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return respond({ error: 'No autorizado' }, { status: 403 });
  }

  if (!fileName || !contentLength || Number.isNaN(contentLength) || contentLength <= 0) {
    return respond({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  const storageKey = buildStorageKey(fileName);
  const uploadUrl = await createUploadUrl({
    key: storageKey,
    contentType: 'application/octet-stream',
    contentLength
  });

  return respond({ uploadUrl, storageKey });
}
