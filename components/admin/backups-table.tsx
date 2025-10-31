'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import type { BackupResult, SearchResponse } from '@/types/search';
import { BACKUP_CATEGORIES } from '@/lib/normalizer';
import { formatBytes, formatDate } from '@/lib/utils';

interface Draft extends BackupResult {}

export const AdminBackupsTable = () => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    search.set('page', String(page));
    search.set('pageSize', String(pageSize));
    return search.toString();
  }, [page, pageSize, query]);

  const { data, mutate, isLoading } = useSWR<SearchResponse>(`/api/backups?${params}`);

  useEffect(() => {
    if (!data) return;
    const nextDrafts: Record<string, Draft> = {};
    data.items.forEach((item) => {
      nextDrafts[item.id] = { ...item };
    });
    setDrafts(nextDrafts);
    setEditing({});
  }, [data]);

const parseDraftValue = (field: keyof Draft, value: string): Draft[keyof Draft] => {
  if (field === 'year' || field === 'size_bytes') {
    if (value.trim().length === 0) {
      return null as Draft[keyof Draft];
    }
    const numeric = Number(value);
    return (Number.isNaN(numeric) ? null : numeric) as Draft[keyof Draft];
  }
  return value as Draft[keyof Draft];
};

const handleChange = (id: string, field: keyof Draft, value: string) => {
  setDrafts((prev) => {
    const previous = prev[id];
    if (!previous) return prev;
    return {
      ...prev,
      [id]: {
        ...previous,
        [field]: parseDraftValue(field, value)
      }
    };
  });
};

  const toggleEdit = (id: string, value: boolean) => {
    setEditing((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const discardChanges = (id: string) => {
    if (!data) return;
    const original = data.items.find((item) => item.id === id);
    if (!original) return;
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...original }
    }));
    toggleEdit(id, false);
  };

  const handleSave = async (id: string) => {
    if (!data) return;
    const original = data.items.find((item) => item.id === id);
    const draft = drafts[id];
    if (!original || !draft) return;

    const changes: Partial<Draft> = {};
    const mutableFields: Array<keyof Draft> = [
      'file_name',
      'category',
      'program_code',
      'program_name',
      'rectoria',
      'sede',
      'period',
      'year',
      'size_bytes',
      'checksum'
    ];

    mutableFields.forEach((field) => {
      if (draft[field] !== original[field]) {
        (changes as Record<keyof Draft, Draft[keyof Draft]>)[field] = draft[field];
      }
    });

    if (Object.keys(changes).length === 0) {
      toggleEdit(id, false);
      return;
    }

    const response = await fetch(`/api/backups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      window.alert(body.error ?? 'No se pudo actualizar el respaldo');
      return;
    }

    await mutate();
    toggleEdit(id, false);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm('¿Eliminar este respaldo de forma permanente? Esta acción no se puede deshacer.');
    if (!shouldDelete) return;

    setDeletingId(id);
    const response = await fetch(`/api/backups/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      window.alert(body.error ?? 'No se pudo eliminar el respaldo');
      setDeletingId(null);
      return;
    }

    await mutate();
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Catálogo de respaldos</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por nombre o programa"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <Button variant="secondary" onClick={() => mutate()} className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Archivo</TableHeaderCell>
                  <TableHeaderCell>Programa</TableHeaderCell>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell>Periodo</TableHeaderCell>
                  <TableHeaderCell>Tamaño</TableHeaderCell>
                  <TableHeaderCell>Creado</TableHeaderCell>
                  <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      Cargando…
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((item) => {
                  const draft = drafts[item.id] ?? item;
                  const isEditing = editing[item.id];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <Input
                            value={draft.file_name}
                            onChange={(event) => handleChange(item.id, 'file_name', event.target.value)}
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900">{item.file_name}</div>
                            <div className="text-xs text-slate-500">{item.id}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={draft.program_name}
                              onChange={(event) => handleChange(item.id, 'program_name', event.target.value)}
                            />
                            <Input
                              value={draft.program_code}
                              onChange={(event) => handleChange(item.id, 'program_code', event.target.value)}
                            />
                            <Input
                              value={draft.rectoria}
                              onChange={(event) => handleChange(item.id, 'rectoria', event.target.value)}
                            />
                            <Input
                              value={draft.sede ?? ''}
                              onChange={(event) => handleChange(item.id, 'sede', event.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{item.program_name}</div>
                            <div className="text-xs text-slate-500">{item.program_code}</div>
                            <Badge variant="outline">{item.rectoria}</Badge>
                            {item.sede && <Badge variant="outline">{item.sede}</Badge>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <select
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={draft.category}
                            onChange={(event) => handleChange(item.id, 'category', event.target.value)}
                          >
                            {BACKUP_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge>{item.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={draft.period ?? ''}
                              onChange={(event) => handleChange(item.id, 'period', event.target.value)}
                            />
                            <Input
                              type="number"
                              value={draft.year ?? ''}
                              onChange={(event) => handleChange(item.id, 'year', event.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div>{item.period ?? '—'}</div>
                            <div className="text-xs text-slate-500">{item.year ?? '—'}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <Input
                            value={draft.size_bytes ?? ''}
                            onChange={(event) => handleChange(item.id, 'size_bytes', event.target.value)}
                          />
                        ) : (
                          formatBytes(item.size_bytes)
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div>{formatDate(item.created_at)}</div>
                          {item.checksum && <div className="text-xs text-slate-500">{item.checksum}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="secondary"
                                className="inline-flex items-center gap-1"
                                onClick={() => discardChanges(item.id)}
                              >
                                <X className="h-4 w-4" />
                                Cancelar
                              </Button>
                              <Button
                                variant="primary"
                                className="inline-flex items-center gap-1"
                                onClick={() => handleSave(item.id)}
                              >
                                <Save className="h-4 w-4" />
                                Guardar
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              className="inline-flex items-center gap-1"
                              onClick={() => toggleEdit(item.id, true)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            className="inline-flex items-center gap-1"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                </TableRow>
              );
            })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <div>
              Página {page} de {Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="subtle" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button
                variant="subtle"
                disabled={page >= Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Siguiente
              </Button>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
