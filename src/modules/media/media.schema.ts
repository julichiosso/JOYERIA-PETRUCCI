import { z } from 'zod';

export const productIdParamSchema = z.object({
  productId: z.string().min(1, 'El productId es requerido'),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

// El altText viaja como campo de texto dentro del mismo multipart/form-data,
// junto a los archivos. Es opcional en la subida (por si el dueño tiene apuro),
// pero se recomienda fuerte completarlo para SEO de imágenes.
export const imageAltTextSchema = z
  .string()
  .trim()
  .min(3, 'El texto alternativo debe describir la imagen (mínimo 3 caracteres)')
  .max(125, 'El texto alternativo no debería superar 125 caracteres')
  .optional();

export const imageIdParamSchema = z.object({
  imageId: z.string().min(1, 'El imageId es requerido'),
});

export type ImageIdParam = z.infer<typeof imageIdParamSchema>;

export const updateImageAltTextSchema = z.object({
  altText: z.string().trim().min(3).max(125),
});

export type UpdateImageAltTextInput = z.infer<typeof updateImageAltTextSchema>;

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, 'Debe incluir al menos una imagen'),
});

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;

// Límites de validación de archivos (usados en media.service.ts)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 10;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];