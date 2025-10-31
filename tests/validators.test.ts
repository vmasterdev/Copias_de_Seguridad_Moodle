import { describe, expect, it } from 'vitest';
import { backupInsertSchema, searchQuerySchema } from '@/lib/validators';

describe('backupInsertSchema', () => {
  const basePayload = {
    file_name: 'archivo.mbz',
    category: 'ESCRIBA',
    program_code: 'ABCD123',
    program_name: 'Programa de Prueba',
    rectoria: 'Centro',
    storage_key: 'folder/archivo.mbz'
  } as const;

  it('acepta payloads completos opcionales', () => {
    const result = backupInsertSchema.safeParse({
      ...basePayload,
      sede: 'Neiva',
      period: '2024-1',
      year: 2024,
      size_bytes: 123456,
      checksum: 'abc'
    });

    expect(result.success).toBe(true);
  });

  it('rechaza categorías fuera del catálogo', () => {
    const invalidPayload = {
      ...basePayload,
      category: 'NO_VALIDA'
    } as unknown as Record<string, unknown>;

    const result = backupInsertSchema.safeParse(invalidPayload);

    expect(result.success).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('coacciona números y aplica defaults', () => {
    const result = searchQuerySchema.parse({
      page: '2',
      pageSize: '50',
      year: '2023'
    });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.year).toBe(2023);
  });

  it('limita pageSize a 100 y rechaza valores inválidos', () => {
    const result = searchQuerySchema.safeParse({
      pageSize: '500'
    });

    expect(result.success).toBe(false);
  });
});
