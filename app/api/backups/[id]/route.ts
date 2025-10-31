import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/auth';
import { backupUpdateSchema } from '@/lib/validators';
import { deleteFromStorage } from '@/lib/minio';

const respondWithCookies = (
  applyCookieMutations: ReturnType<typeof createRouteSupabaseClient>['applyCookieMutations']
) => {
  return <T>(body: T, init?: ResponseInit) => applyCookieMutations(NextResponse.json(body, init));
};

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const {
    params: { id }
  } = context;

  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = backupUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido', details: parsed.error.format() }, { status: 400 });
  }

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

  const payload = parsed.data;

  if (payload.program_code && payload.program_name && payload.rectoria) {
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
  }

  const updatePayload: Record<string, unknown> = {};
  if (payload.file_name !== undefined) updatePayload.file_name = payload.file_name;
  if (payload.category !== undefined) updatePayload.category = payload.category;
  if (payload.program_code !== undefined) updatePayload.program_code = payload.program_code;
  if (payload.program_name !== undefined) updatePayload.program_name = payload.program_name;
  if (payload.rectoria !== undefined) updatePayload.rectoria = payload.rectoria;
  if (payload.sede !== undefined) updatePayload.sede = payload.sede ?? null;
  if (payload.period !== undefined) updatePayload.period = payload.period ?? null;
  if (payload.year !== undefined) updatePayload.year = payload.year ?? null;
  if (payload.size_bytes !== undefined) updatePayload.size_bytes = payload.size_bytes ?? null;
  if (payload.checksum !== undefined) updatePayload.checksum = payload.checksum ?? null;

  if (Object.keys(updatePayload).length === 0) {
    return respond({ error: 'Sin cambios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('backups')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return respond({ error: error.message }, { status: 500 });
  }

  return respond({ backup: data });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const {
    params: { id }
  } = context;

  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

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

  const { data: backup, error: fetchError } = await supabase
    .from('backups')
    .select('id, storage_key')
    .eq('id', id)
    .single();

  if (fetchError) {
    const status = fetchError.code === 'PGRST116' ? 404 : 500;
    return respond({ error: fetchError.message }, { status });
  }

  if (!backup) {
    return respond({ error: 'Respaldo no encontrado' }, { status: 404 });
  }

  try {
    await deleteFromStorage(backup.storage_key);
  } catch (error) {
    console.error('Error deleting object from storage', error);
    return respond(
      { error: 'No fue posible eliminar el archivo del almacenamiento' },
      { status: 502 }
    );
  }

  const { error: deleteError } = await supabase.from('backups').delete().eq('id', id);

  if (deleteError) {
    return respond({ error: deleteError.message }, { status: 500 });
  }

  return respond({ success: true });
}
