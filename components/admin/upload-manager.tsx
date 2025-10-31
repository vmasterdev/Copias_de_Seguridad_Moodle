'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadCloud, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { BACKUP_CATEGORIES, normalizeMetadata } from '@/lib/normalizer';

interface UploadItemForm {
  file_name: string;
  category: string;
  program_code: string;
  program_name: string;
  rectoria: string;
  sede: string;
  period: string;
  year: string;
  checksum?: string;
  size_bytes?: number;
}

type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'registering' | 'registered' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
  storageKey?: string;
  checksum?: string;
  form: UploadItemForm;
}

export const UploadManager = () => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const nextItems: UploadItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.mbz')) return;
      const metadata = normalizeMetadata(file.name);
      nextItems.push({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        form: {
          file_name: file.name,
          category: metadata.category ?? '',
          program_code: metadata.programCode ?? '',
          program_name: metadata.programName ?? '',
          rectoria: metadata.rectoria ?? '',
          sede: metadata.sede ?? '',
          period: metadata.period ?? '',
          year: metadata.year ? String(metadata.year) : '',
          size_bytes: file.size
        }
      });
    });
    if (nextItems.length > 0) {
      setItems((prev) => [...prev, ...nextItems]);
    }
  }, []);

  const computeChecksum = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const requestUploadUrl = async (file: File) => {
    const params = new URLSearchParams({
      fileName: file.name,
      contentLength: String(file.size)
    });
    const response = await fetch(`/api/upload-url?${params.toString()}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? 'No fue posible obtener la URL de subida');
    }
    return response.json() as Promise<{ uploadUrl: string; storageKey: string }>;
  };

  const uploadToMinio = async (file: File, uploadUrl: string) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: file
    });
    if (!response.ok) {
      throw new Error('Error subiendo el archivo a MinIO');
    }
  };

  const registerBackup = async (item: UploadItem) => {
    if (!item.storageKey) {
      throw new Error('Falta storageKey, sube el archivo primero.');
    }

    const requiredFields: Array<keyof UploadItemForm> = [
      'file_name',
      'category',
      'program_code',
      'program_name',
      'rectoria'
    ];

    for (const field of requiredFields) {
      if (!item.form[field] || String(item.form[field]).trim().length === 0) {
        throw new Error('Completa todos los campos obligatorios.');
      }
    }

    const payload = {
      file_name: item.form.file_name,
      category: item.form.category,
      program_code: item.form.program_code,
      program_name: item.form.program_name,
      rectoria: item.form.rectoria,
      sede: item.form.sede || null,
      period: item.form.period || null,
      year: item.form.year ? Number(item.form.year) : null,
      size_bytes: item.form.size_bytes ?? item.file.size,
      checksum: item.form.checksum || item.checksum || null,
      storage_key: item.storageKey
    };

    const response = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? 'Error registrando el respaldo');
    }
  };

  const handleUpload = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'uploading', error: undefined } : item))
    );

    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    try {
      const [checksum, { uploadUrl, storageKey }] = await Promise.all([
        computeChecksum(item.file),
        requestUploadUrl(item.file)
      ]);

      await uploadToMinio(item.file, uploadUrl);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'uploaded',
                storageKey,
                checksum,
                form: { ...entry.form, checksum }
              }
            : entry
        )
      );
    } catch (error) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'error',
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            : entry
        )
      );
    }
  };

  const handleRegister = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'registering', error: undefined } : item))
    );

    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    try {
      await registerBackup(item);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'registered'
              }
            : entry
        )
      );
    } catch (error) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'error',
                error: error instanceof Error ? error.message : 'Error registrando metadata'
              }
            : entry
        )
      );
    }
  };

  const updateItemForm = (id: string, field: keyof UploadItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              form: {
                ...item.form,
                [field]: field === 'size_bytes' ? Number(value) : value
              }
            }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const dropHandlers = useMemo(
    () => ({
      onDrop: (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      },
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
      }
    }),
    [addFiles]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sube nuevas copias</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...dropHandlers}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500"
          >
            <UploadCloud className="h-10 w-10 text-brand-500" />
            <div>
              <p className="font-medium text-slate-700">Arrastra archivos .mbz aquí</p>
              <p className="text-sm">o</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                className="mt-2"
              >
                Seleccionar archivos
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".mbz"
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-brand-400">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{item.form.file_name}</CardTitle>
                  <p className="text-sm text-slate-500">{formatBytes(item.file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.error && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" /> {item.error}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Nombre del archivo"
                    value={item.form.file_name}
                    onChange={(value) => updateItemForm(item.id, 'file_name', value)}
                    required
                  />
                  <SelectField
                    label="Categoría"
                    value={item.form.category}
                    onChange={(value) => updateItemForm(item.id, 'category', value)}
                    options={BACKUP_CATEGORIES.map((category) => ({ value: category, label: category }))}
                    required
                  />
                  <Field
                    label="Programa (código)"
                    value={item.form.program_code}
                    onChange={(value) => updateItemForm(item.id, 'program_code', value)}
                    required
                  />
                  <Field
                    label="Programa (nombre)"
                    value={item.form.program_name}
                    onChange={(value) => updateItemForm(item.id, 'program_name', value)}
                    required
                  />
                  <Field
                    label="Rectoría"
                    value={item.form.rectoria}
                    onChange={(value) => updateItemForm(item.id, 'rectoria', value)}
                    required
                  />
                  <Field
                    label="Sede"
                    value={item.form.sede}
                    onChange={(value) => updateItemForm(item.id, 'sede', value)}
                  />
                  <Field
                    label="Periodo"
                    value={item.form.period}
                    onChange={(value) => updateItemForm(item.id, 'period', value)}
                    placeholder="2024-2"
                  />
                  <Field
                    label="Año"
                    type="number"
                    value={item.form.year}
                    onChange={(value) => updateItemForm(item.id, 'year', value)}
                  />
                  <Field
                    label="Checksum (SHA-256)"
                    value={item.form.checksum ?? ''}
                    onChange={(value) => updateItemForm(item.id, 'checksum', value)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Badge variant="outline">{item.storageKey ?? 'sin subir'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={item.status === 'uploading' || item.status === 'uploaded' || item.status === 'registered'}
                      onClick={() => handleUpload(item.id)}
                      className="inline-flex items-center gap-2"
                    >
                      {item.status === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={!item.storageKey || item.status === 'registering' || item.status === 'registered'}
                      onClick={() => handleRegister(item.id)}
                      className="inline-flex items-center gap-2"
                    >
                      {item.status === 'registering' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Registrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: UploadStatus }) => {
  const map: Record<UploadStatus, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-slate-200 text-slate-700' },
    uploading: { label: 'Subiendo', color: 'bg-blue-100 text-blue-700' },
    uploaded: { label: 'Subido', color: 'bg-emerald-100 text-emerald-700' },
    registering: { label: 'Registrando', color: 'bg-amber-100 text-amber-700' },
    registered: { label: 'Registrado', color: 'bg-emerald-200 text-emerald-800' },
    error: { label: 'Error', color: 'bg-red-100 text-red-700' }
  };

  const entry = map[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.color}`}>{entry.label}</span>;
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

const Field = ({ label, value, onChange, required, placeholder, type = 'text' }: FieldProps) => (
  <label className="space-y-1 text-sm text-slate-600">
    <span className="font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    <Input value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} type={type} />
  </label>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

const SelectField = ({ label, value, onChange, options, required }: SelectFieldProps) => (
  <label className="space-y-1 text-sm text-slate-600">
    <span className="font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    <select
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    >
      <option value="">Selecciona una opción</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
