// src/modules/categories/category.service.ts
import { categoryRepository } from './category.repository.js';
import { slugify } from '../../shared/utils/slugify.js';
import {
  BadRequestError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from '../../shared/errors/index.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema.js';

export const categoryService = {
  // ---------- Create ----------
  async create(input: CreateCategoryInput) {
    // Validación de profundidad: máximo 2 niveles
    if (input.parentId) {
      const parent = await categoryRepository.findParentForValidation(input.parentId);

      if (!parent) {
        throw new NotFoundError('La categoría padre indicada no existe');
      }

      if (parent.parentId !== null) {
        throw new BadRequestError(
          'No se puede crear un tercer nivel de categorías. La categoría padre ya es una subcategoría.'
        );
      }
    }

    const baseSlug = slugify(input.name);
    const slug = await categoryRepository.findNextAvailableSlug(baseSlug);

    return categoryRepository.create({ ...input, slug });
  },

  // ---------- Admin: listar flat ----------
  async findAllFlat() {
    return categoryRepository.findAllFlat();
  },

  // ---------- Admin/público: detalle ----------
  async findById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }
    return category;
  },

  // ---------- Público: árbol activo ----------
  async findActiveTree() {
    return categoryRepository.findActiveTree();
  },

  // ---------- Update ----------
  async update(id: string, input: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Categoría no encontrada');
    }

    return categoryRepository.update(id, input);
  },

  // ---------- Delete: 3 chequeos ----------
  async delete(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    if (category.isProtected) {
      throw new ForbiddenError(
        'Esta categoría está protegida y no puede eliminarse.'
      );
    }

    const productCount = await categoryRepository.countProducts(id);
    if (productCount > 0) {
      throw new ConflictError(
        `No se puede eliminar: tiene ${productCount} producto${productCount === 1 ? '' : 's'} asociado${productCount === 1 ? '' : 's'}.`,
        { reason: 'HAS_PRODUCTS', count: productCount }
      );
    }

    const childrenCount = await categoryRepository.countChildren(id);
    if (childrenCount > 0) {
      throw new ConflictError(
        `No se puede eliminar: tiene ${childrenCount} subcategoría${childrenCount === 1 ? '' : 's'} asociada${childrenCount === 1 ? '' : 's'}.`,
        { reason: 'HAS_CHILDREN', count: childrenCount }
      );
    }

    await categoryRepository.delete(id);
  },
};