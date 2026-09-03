import { z } from 'zod';

export const productStatusEnum = z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']);

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('El precio debe ser mayor a 0').optional(),
  status: productStatusEnum.default('DRAFT'),
  showPrice: z.boolean().default(false),
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
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// ---------- Variant Schemas ----------

export const createVariantSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la variante es requerido').max(100),
  sku: z.string().trim().min(1).max(50).optional(),
  price: z.number().positive('El precio debe ser mayor a 0').optional().nullable(),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  order: z.number().int().min(0).optional(),
});

export type CreateVariantSchema = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    sku: z.string().trim().min(1).max(50).optional().nullable(),
    price: z.number().positive('El precio debe ser mayor a 0').optional().nullable(),
    stock: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export type UpdateVariantSchema = z.infer<typeof updateVariantSchema>;

export const variantIdParamSchema = z.object({
  variantId: z.string().min(1, 'El variantId es requerido'),
});

export type VariantIdParam = z.infer<typeof variantIdParamSchema>;

export const reorderVariantsSchema = z.object({
  variantIds: z.array(z.string().min(1)).min(1, 'Debe incluir al menos una variante'),
});

export type ReorderVariantsInput = z.infer<typeof reorderVariantsSchema>;