'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDate } from '@/lib/utils';
import type { BackupResult } from '@/types/search';

interface ResultsTableProps {
  items: BackupResult[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const ResultsTable = ({
  items,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onRefresh
}: ResultsTableProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      const response = await fetch(`/api/signed-url?backupId=${id}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'No fue posible generar el enlace');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error ? error.message : 'Ocurrió un error generando el enlace de descarga'
      );
    } finally {
      setDownloadingId(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Archivo</TableHeaderCell>
              <TableHeaderCell>Categoría</TableHeaderCell>
              <TableHeaderCell>Programa</TableHeaderCell>
              <TableHeaderCell>Periodo</TableHeaderCell>
              <TableHeaderCell>Tamaño</TableHeaderCell>
              <TableHeaderCell>Creación</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  No se encontraron resultados con los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                  </span>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-xs truncate font-medium text-slate-900">
                  {item.file_name}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <span className="block font-medium text-slate-900">{item.program_name}</span>
                  <span className="text-xs text-slate-500">{item.program_code}</span>
                </TableCell>
                <TableCell>
                  {item.period ?? (item.year ? `${item.year}` : '—')}
                </TableCell>
                <TableCell>{formatBytes(item.size_bytes)}</TableCell>
                <TableCell>{formatDate(item.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(item.id)}
                    disabled={downloadingId === item.id}
                    className="inline-flex items-center gap-1"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Obtener enlace
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="subtle" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          <Button
            variant="subtle"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
