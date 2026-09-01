// src/modules/inquiries/inquiry.schema.ts
import { z } from 'zod';

export const createInquirySchema = z.object({
  productId: z.string().min(1, 'El productId es requerido'),
  variantId: z.string().min(1).optional(),
  productUrl: z.string().url('Debe ser una URL válida').optional(),
});

export type CreateInquirySchema = z.infer<typeof createInquirySchema>;

export const inquiryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  productId: z.string().optional(),
});

export type InquiryListQuerySchema = z.infer<typeof inquiryListQuerySchema>;
