import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import { env } from '@/lib/env';

const s3Client = new S3Client({
  region: env.MINIO_REGION ?? 'us-east-1',
  endpoint: env.MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY
  }
});

export const buildStorageKey = (fileName: string) => {
  const trimmed = fileName.trim().toLowerCase();
  const extensionMatch = trimmed.match(/(\.[a-z0-9]+)$/i);
  const extension = extensionMatch ? extensionMatch[1] : '.mbz';
  const base = extensionMatch ? trimmed.slice(0, -extension.length) : trimmed;
  const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'backup';
  const unique = crypto.randomUUID();
  return `${slug}-${unique}${extension}`;
};

export const createDownloadUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key
  });
  return getSignedUrl(s3Client, command, {
    expiresIn: env.DOWNLOAD_URL_TTL_SECS
  });
};

export const createUploadUrl = async (params: {
  key: string;
  contentType: string;
  contentLength: number;
}) => {
  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength
  });
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: env.UPLOAD_URL_TTL_SECS
  });
  return url;
};

export const deleteFromStorage = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key
  });

  await s3Client.send(command);
};
