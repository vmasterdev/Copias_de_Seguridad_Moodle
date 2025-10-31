'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultsTable } from '@/components/search/results-table';
import type { SearchResponse } from '@/types/search';

const DEBOUNCE_MS = 200;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const SearchClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const next = searchParams.get('q') ?? '';
    if (next !== query) {
      setQuery(next);
      setDebouncedQuery(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const paramsObject = useMemo(() => {
    const entries = Array.from(searchParams.entries());
    return Object.fromEntries(entries);
  }, [searchParams]);

  const page = Number(paramsObject.page ?? '1');
  const pageSize = Number(paramsObject.pageSize ?? '20');

  const apiKey = useMemo(() => {
    const nextSearch = new URLSearchParams(paramsObject);
    if (debouncedQuery) {
      nextSearch.set('q', debouncedQuery);
    } else {
      nextSearch.delete('q');
    }
    if (!nextSearch.has('page')) {
      nextSearch.set('page', String(page));
    }
    if (!nextSearch.has('pageSize')) {
      nextSearch.set('pageSize', String(pageSize));
    }
    return `/api/search?${nextSearch.toString()}`;
  }, [debouncedQuery, page, pageSize, paramsObject]);

  const { data, isLoading, isValidating, mutate } = useSWR<SearchResponse>(apiKey);

  const setParam = useCallback(
    (key: string, value?: string | null) => {
      const next = new URLSearchParams(paramsObject);
      if (value && value.length > 0) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [paramsObject, pathname, router]
  );

  const currentQuery = paramsObject.q ?? '';

  useEffect(() => {
    if ((debouncedQuery ?? '') === currentQuery) {
      return;
    }
    setParam('q', debouncedQuery);
  }, [currentQuery, debouncedQuery, setParam]);

  const handleFilter = (key: string, value: string) => {
    const current = paramsObject[key];
    setParam(key, current === value ? null : value);
  };

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(paramsObject);
    next.set('page', String(nextPage));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (nextSize: number) => {
    const next = new URLSearchParams(paramsObject);
    next.set('pageSize', String(nextSize));
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const activeFilters = useMemo(() => {
    const keys = ['category', 'rectoria', 'sede', 'programCode', 'period', 'year'] as const;
    return keys
      .map((key) => {
        const value = paramsObject[key];
        if (!value) return null;
        return { key, value } as { key: string; value: string };
      })
      .filter(Boolean) as { key: string; value: string }[];
  }, [paramsObject]);

  const clearFilter = (key: string) => setParam(key, null);

  const clearAllFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca por nombre de archivo, programa o periodo"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                value={paramsObject.category ?? ''}
                onChange={(event) => handleFilter('category', event.target.value)}
              >
                <option value="">Categoría</option>
                {data?.facets.categories?.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value} ({facet.count})
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                value={paramsObject.rectoria ?? ''}
                onChange={(event) => handleFilter('rectoria', event.target.value)}
              >
                <option value="">Rectoría</option>
                {data?.facets.rectorias?.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value} ({facet.count})
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                value={paramsObject.sede ?? ''}
                onChange={(event) => handleFilter('sede', event.target.value)}
              >
                <option value="">Sede</option>
                {data?.facets.sedes?.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value} ({facet.count})
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                value={paramsObject.programCode ?? ''}
                onChange={(event) => handleFilter('programCode', event.target.value)}
              >
                <option value="">Programa</option>
                {data?.facets.programs?.map((facet) => {
                  const label = facet.label ? `${facet.label} (${facet.value})` : facet.value;
                  return (
                    <option key={facet.value} value={facet.value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                value={paramsObject.period ?? ''}
                onChange={(event) => handleFilter('period', event.target.value)}
              >
                <option value="">Periodo</option>
                {data?.facets.periods?.map((facet) => (
                  <option key={facet.value} value={facet.value}>
                    {facet.value}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={2000}
                max={2100}
                className="w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                placeholder="Año"
                value={paramsObject.year ?? ''}
                onChange={(event) => handleFilter('year', event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.key}-${filter.value}`}
                variant="outline"
                className="flex items-center gap-1"
              >
                <span>
                  {filter.key}: {filter.value}
                </span>
                <button type="button" onClick={() => clearFilter(filter.key)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
            {activeFilters.length > 0 && (
              <Button variant="subtle" onClick={clearAllFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Resultados {data ? `(${data.total})` : ''}</span>
            {isValidating && <span className="text-xs text-slate-500">Actualizando…</span>}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Elementos por página</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
              value={pageSize}
              onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ResultsTable
            loading={isLoading}
            items={data?.items ?? []}
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            onPageChange={handlePageChange}
            onRefresh={() => mutate()}
          />
        </CardContent>
      </Card>
    </div>
  );
};
