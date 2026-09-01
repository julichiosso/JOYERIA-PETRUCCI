// src/modules/inquiries/inquiry.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { inquiryService } from './inquiry.service.js';
import type { CreateInquirySchema, InquiryListQuerySchema } from './inquiry.schema.js';

export const inquiryController = {
  async create(
    request: FastifyRequest<{ Body: CreateInquirySchema }>,
    reply: FastifyReply
  ) {
    const result = await inquiryService.createInquiry(request.body);
    return reply.status(201).send(result);
  },

  async list(
    request: FastifyRequest<{ Querystring: InquiryListQuerySchema }>,
    reply: FastifyReply
  ) {
    const result = await inquiryService.listInquiries(request.query);
    return reply.status(200).send(result);
  },

  async stats(_request: FastifyRequest, reply: FastifyReply) {
    const result = await inquiryService.getStats();
    return reply.status(200).send(result);
  },
};
