import { Suspense } from 'react';
import { SearchClient } from '@/components/search/search-client';

export const dynamic = 'force-dynamic';

export default function PublicSearchPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Repositorio de Copias Moodle</h1>
        <p className="mt-2 text-sm text-slate-600">
          Busca y descarga copias de seguridad catalogadas por categoría, programa y periodo.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
