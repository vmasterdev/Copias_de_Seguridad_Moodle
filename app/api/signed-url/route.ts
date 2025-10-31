import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase/server';
import { createDownloadUrl } from '@/lib/minio';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const backupId = searchParams.get('backupId');

  if (!backupId) {
    return NextResponse.json({ error: 'backupId requerido' }, { status: 400 });
  }

  const { supabase, applyCookieMutations } = createRouteSupabaseClient(request);
  const { data: backup, error } = await supabase
    .from('backups')
    .select('id, storage_key')
    .eq('id', backupId)
    .single();

  if (error || !backup) {
    return applyCookieMutations(NextResponse.json({ error: 'Respaldo no encontrado' }, { status: 404 }));
  }

  const url = await createDownloadUrl(backup.storage_key);

  return applyCookieMutations(NextResponse.json({ url }));
}
