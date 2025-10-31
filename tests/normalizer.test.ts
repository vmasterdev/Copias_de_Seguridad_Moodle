import { describe, expect, it } from 'vitest';
import { normalizeMetadata } from '@/lib/normalizer';

describe('normalizeMetadata', () => {
  it('detecta categoría y periodo en nombres estándar', () => {
    const metadata = normalizeMetadata('ESCRIBA-AdministracionEmpresas-2024-1.mbz');
    expect(metadata.category).toBe('ESCRIBA');
    expect(metadata.programCode).toBeUndefined();
    expect(metadata.period).toBe('2024-1');
    expect(metadata.year).toBe(2024);
    expect(metadata.programName).toBe('Administracionempresas');
  });

  it('extrae metadatos combinados y limpia tokens repetidos', () => {
    const metadata = normalizeMetadata('distancia-4.0_centro occidente_medellin_vdtec045_Ingenieria Sistemas_2023-2.mbz');
    expect(metadata.category).toBe('DISTANCIA 4.0');
    expect(metadata.programCode).toBe('VDTEC045');
    expect(metadata.sede).toBe('Medellin');
    expect(metadata.rectoria).toBe('Centro Occidente');
    expect(metadata.period).toBe('2023-2');
    expect(metadata.programName).toBe('Ingenieria Sistemas');
  });

  it('tolera archivos sin coincidencias y devuelve undefined', () => {
    const metadata = normalizeMetadata('respaldo-sin-metadata.mbz');
    expect(metadata).toEqual({
      category: undefined,
      programCode: undefined,
      programName: 'Respaldo Sin Metadata',
      rectoria: undefined,
      sede: undefined,
      period: undefined,
      year: undefined
    });
  });
});
