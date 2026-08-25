// src/modules/categories/category.repository.ts
import { prisma } from '../../infra/prisma/prisma.ts';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema.ts';

const TENANT_ID = 'default'; // TODO: reemplazar cuando exista contexto multi-tenant real

export const categoryRepository = {
  // ---------- Slug único por tenant ----------
  async findNextAvailableSlug(baseSlug: string): Promise<string> {
    const existing = await prisma.category.findMany({
      where: {
        tenantId: TENANT_ID,
        slug: { startsWith: baseSlug },
      },
      select: { slug: true },
    });

    if (existing.length === 0) return baseSlug;

    const exactMatch = existing.some((c) => c.slug === baseSlug);
    if (!exactMatch) return baseSlug;

    const numbers = existing
      .map((c) => {
        const match = c.slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
    return `${baseSlug}-${nextNumber}`;
  },

  // ---------- Create ----------
  async create(data: CreateCategoryInput & { slug: string }) {
    return prisma.category.create({
      data: {
        tenantId: TENANT_ID,
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
      },
    });
  },

  // ---------- Validar padre (máx 2 niveles) ----------
  async findParentForValidation(parentId: string) {
    return prisma.category.findUnique({
      where: { id: parentId, tenantId: TENANT_ID },
      select: { id: true, parentId: true },
    });
  },

  // ---------- Admin: listar flat ----------
  async findAllFlat() {
    return prisma.category.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });
  },

  // ---------- Admin/público: por id ----------
  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id, tenantId: TENANT_ID },
    });
  },

  // ---------- Público: árbol activo ----------
  async findActiveTree() {
    // Traigo solo raíces activas con sus hijos activos ya anidados.
    // Si el padre está inactivo, la rama entera queda afuera (regla acordada).
    return prisma.category.findMany({
      where: {
        tenantId: TENANT_ID,
        parentId: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  // ---------- Update ----------
  async update(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id, tenantId: TENANT_ID },
      data,
    });
  },

  // ---------- Delete: chequeos previos ----------
  async countProducts(categoryId: string) {
    return prisma.product.count({ where: { categoryId } });
  },

  async countChildren(categoryId: string) {
    return prisma.category.count({ where: { parentId: categoryId } });
  },

  async delete(id: string) {
    return prisma.category.delete({
      where: { id, tenantId: TENANT_ID },
    });
  },
};