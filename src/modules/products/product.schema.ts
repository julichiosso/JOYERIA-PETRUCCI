import { z } from 'zod';

export const productStatusEnum = z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']);

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('El precio debe ser mayor a 0').optional(),
  status: productStatusEnum.default('DRAFT'),
  variantLabel: z.string().max(100).optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  metaTitle: z.string().max(70, 'El metaTitle no debería superar 70 caracteres para SEO').optional(),
  metaDescription: z.string().max(160, 'La metaDescription no debería superar 160 caracteres para SEO').optional(),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductSchema = z.infer<typeof updateProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

export const productSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export type ProductSlugParam = z.infer<typeof productSlugParamSchema>;

export const productListQuerySchema = z.object({
  categoryId: z.string().optional(),
  status: productStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;