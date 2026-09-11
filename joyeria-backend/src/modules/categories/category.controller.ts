// src/modules/categories/category.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { categoryService } from './category.service.js';
import { auditService } from '../audit/audit.service.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryParams,
} from './category.schema.js';

export const categoryController = {
  async create(
    request: FastifyRequest<{ Body: CreateCategoryInput }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.create(request.body);

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'CATEGORY_CREATE',
      entityType: 'Category',
      entityId: category.id,
      description: `Creó la categoría "${category.name}" (Slug: ${category.slug})`,
    });

    return reply.status(201).send(category);
  },

  async findAllTree(_request: FastifyRequest, reply: FastifyReply) {
    const categories = await categoryService.findAllTree();
    return reply.send(categories);
  },

  async findAllFlat(_request: FastifyRequest, reply: FastifyReply) {
    const categories = await categoryService.findAllFlat();
    return reply.send(categories);
  },

  async findById(
    request: FastifyRequest<{ Params: CategoryParams }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.findById(request.params.id);
    return reply.send(category);
  },

  async findActiveTree(_request: FastifyRequest, reply: FastifyReply) {
    const tree = await categoryService.findActiveTree();
    return reply.send(tree);
  },

  async update(
    request: FastifyRequest<{ Params: CategoryParams; Body: UpdateCategoryInput }>,
    reply: FastifyReply
  ) {
    const category = await categoryService.update(request.params.id, request.body);

    const user = (request as any).user;
    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'CATEGORY_UPDATE',
      entityType: 'Category',
      entityId: category.id,
      description: `Modificó la categoría "${category.name}" (Campos: ${Object.keys(request.body).join(', ')})`,
    });

    return reply.send(category);
  },

  async delete(
    request: FastifyRequest<{ Params: CategoryParams }>,
    reply: FastifyReply
  ) {
    const user = (request as any).user;
    await categoryService.delete(request.params.id);

    await auditService.log({
      userId: user?.userId,
      userEmail: user?.email,
      userName: user?.name ?? (user?.email === 'webya@joyeriapetrucci.com' ? 'WebYa (Admin Dev)' : 'Víctor'),
      action: 'CATEGORY_DELETE',
      entityType: 'Category',
      entityId: request.params.id,
      description: `Eliminó la categoría ID: ${request.params.id}`,
    });

    return reply.status(204).send();
  },
};