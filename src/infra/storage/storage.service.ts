import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from './s3.client.js';
import crypto from 'node:crypto';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';


export async function deleteFile(key: string): Promise<void> {
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