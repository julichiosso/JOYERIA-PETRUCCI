// src/modules/categories/category.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { categoryService } from './category.service.js';
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
    return reply.send(category);
  },

  async delete(
    request: FastifyRequest<{ Params: CategoryParams }>,
    reply: FastifyReply
  ) {
    await categoryService.delete(request.params.id);
    return reply.status(204).send();
  },
};