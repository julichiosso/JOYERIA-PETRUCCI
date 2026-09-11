import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from './audit.service.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { ForbiddenError } from '../../shared/errors/index.js';

export async function auditAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; entityType?: string; action?: string } }>, reply: FastifyReply) => {
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenError('Acceso restringido a administradores.');
    }

    const logs = await auditService.list({
      page: request.query.page ? Number(request.query.page) : 1,
      limit: request.query.limit ? Number(request.query.limit) : 25,
      search: request.query.search,
      entityType: request.query.entityType,
      action: request.query.action,
    });

    return reply.status(200).send(logs);
  });
}
