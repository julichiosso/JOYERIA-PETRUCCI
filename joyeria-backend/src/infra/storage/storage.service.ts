import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from './s3.client.js';
import { env } from '../../config/env.js';
import crypto from 'node:crypto';

export function getPublicUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }

  // Derive public URL from S3_ENDPOINT
  const baseUrl = env.S3_ENDPOINT
    .replace('.storage.supabase.co/storage/v1/s3', '.supabase.co/storage/v1/object/public')
    .replace('/storage/v1/s3', '/storage/v1/object/public');

  return `${baseUrl}/${S3_BUCKET}/${keyOrUrl.replace(/^\/+/, '')}`;
}

export async function deleteFile(keyOrUrl: string): Promise<void> {
  const key = keyOrUrl.includes(`/${S3_BUCKET}/`)
    ? keyOrUrl.split(`/${S3_BUCKET}/`)[1]
    : keyOrUrl;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

export async function uploadFile(params: {
  buffer: Buffer;
  contentType: string;
  folder: string;
}): Promise<string> {
  const extension = params.contentType.split('/')[1] ?? 'bin';
  const key = `${params.folder}/${crypto.randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return key;
}