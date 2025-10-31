import { z } from 'zod';
import type { BackupCategory } from '@/lib/normalizer';

const categoryEnum = z.enum(['ESCRIBA', 'CRIBA', 'INNOVAME', 'DISTANCIA 4.0']);

type MaybeNullable<T> = T | null | undefined;

export const backupInsertSchema = z.object({
  file_name: z.string().min(1),
  category: categoryEnum,
  program_code: z.string().min(1),
  program_name: z.string().min(1),
  rectoria: z.string().min(1),
  sede: z.preprocess((val) => (val === '' ? null : val), z.string().min(1).nullable()).optional(),
  period: z.preprocess((val) => (val === '' ? null : val), z.string().min(1).nullable()).optional(),
  year: z
    .preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z
      .number()
      .int()
      .min(2000)
      .max(2100)
      .nullable()
      .optional())
    .optional(),
  size_bytes: z
    .preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional())
    .optional(),
  checksum: z.preprocess((val) => (val === '' ? null : val), z.string().min(1).nullable()).optional(),
  storage_key: z.string().min(1)
});

export const backupPatchSchema = backupInsertSchema.partial().extend({
  id: z.string().uuid()
});

export const backupUpdateSchema = z.object({
  file_name: z.string().min(1).optional(),
  category: categoryEnum.optional(),
  program_code: z.string().min(1).optional(),
  program_name: z.string().min(1).optional(),
  rectoria: z.string().min(1).optional(),
  sede: z.preprocess((val) => (val === '' ? null : val), z.string().nullable()).optional(),
  period: z.preprocess((val) => (val === '' ? null : val), z.string().nullable()).optional(),
  year: z
    .preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z
      .number()
      .int()
      .min(2000)
      .max(2100)
      .nullable()
      .optional())
    .optional(),
  size_bytes: z
    .preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional())
    .optional(),
  checksum: z.preprocess((val) => (val === '' ? null : val), z.string().nullable()).optional()
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: categoryEnum.optional(),
  rectoria: z.string().optional(),
  sede: z.string().optional(),
  programCode: z.string().optional(),
  period: z.string().optional(),
  year: z
    .preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional())
    .optional(),
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().int().positive().default(1))
    .optional(),
  pageSize: z
    .preprocess((val) => (val ? Number(val) : 20),
      z.number().int().positive().max(100).default(20))
    .optional()
});

export type BackupPayload = z.infer<typeof backupInsertSchema> & { category: BackupCategory };
export type BackupPatchPayload = z.infer<typeof backupPatchSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type BackupUpdatePayload = z.infer<typeof backupUpdateSchema>;
