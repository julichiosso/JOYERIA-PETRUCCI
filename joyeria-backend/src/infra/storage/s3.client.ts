import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';

export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // requerido por Supabase Storage (y la mayoría de S3-compatibles que no son AWS)
});

export const S3_BUCKET = env.S3_BUCKET_NAME;