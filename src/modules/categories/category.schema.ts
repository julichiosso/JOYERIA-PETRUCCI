// src/modules/categories/category.schema.ts
import { z } from 'zod';

// ---------- Params ----------
export const categoryParamsSchema = z.object({
  id: z.string().cuid(),
});

// ---------- Create ----------
export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  description: z.string().trim().max(500).optional(),
  parentId: z.string().cuid().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ---------- Update ----------
// parentId NO se puede editar acá: mover una categoría de padre cambia
// la profundidad del árbol y rompe la regla de 2 niveles con efectos
// en cascada sobre los hijos. Si hace falta más adelante, es un
// endpoint aparte con su propia validación (moveCategory).
export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;