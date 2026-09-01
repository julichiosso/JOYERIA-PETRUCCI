import { z } from 'zod';

// wa.me requiere el número en formato internacional, solo dígitos, sin +, espacios ni guiones.
// Ej: para Argentina +54 9 3407 12-3456 → 5493407123456
const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, 'El número de WhatsApp debe tener solo dígitos, en formato internacional (ej: 5493407123456), sin +, espacios ni guiones');

export const updateStoreConfigSchema = z
  .object({
    storeName: z.string().trim().min(2).max(100).optional(),
    whatsappNumber: whatsappNumberSchema.optional(),
    whatsappMessageTemplate: z
      .string()
      .trim()
      .max(500)
      .refine((val) => val.includes('{productName}'), {
        message: 'El template debe incluir el placeholder {productName}',
      })
      .optional(),
    instagramUrl: z.string().trim().url('Debe ser una URL válida').optional(),
    facebookUrl: z.string().trim().url('Debe ser una URL válida').optional(),
    address: z.string().trim().max(200).optional(),
    businessHours: z.string().trim().max(300).optional(),
    returnPolicy: z.string().trim().max(2000).optional(),
    shippingInfo: z.string().trim().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export type UpdateStoreConfigSchema = z.infer<typeof updateStoreConfigSchema>;