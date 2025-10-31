import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE: z.string().optional(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_REGION: z.string().optional(),
  DOWNLOAD_URL_TTL_SECS: z.coerce.number().default(600),
  UPLOAD_URL_TTL_SECS: z.coerce.number().default(600)
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
  MINIO_BUCKET: process.env.MINIO_BUCKET,
  MINIO_REGION: process.env.MINIO_REGION,
  DOWNLOAD_URL_TTL_SECS: process.env.DOWNLOAD_URL_TTL_SECS ?? '600',
  UPLOAD_URL_TTL_SECS: process.env.UPLOAD_URL_TTL_SECS ?? '600'
});

if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(`Configuración inválida: ${JSON.stringify(formatted, null, 2)}`);
}

export const env = parsed.data;
