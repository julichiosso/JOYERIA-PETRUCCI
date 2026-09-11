import { prisma } from '../../infra/prisma.js';

export interface CreateAuditLogInput {
  userId?: string | null;
  userName?: string;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  action?: string;
}

export const auditService = {
  async log(input: CreateAuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          tenantId: 'default',
          userId: input.userId ?? null,
          userName: input.userName ?? 'Sistema',
          userEmail: input.userEmail ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          description: input.description,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          ipAddress: input.ipAddress ?? null,
        },
      });
    } catch (err) {
      console.error('Error guardando audit log:', err);
      return null;
    }
  },

  async list(params: ListAuditLogsQuery) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: 'default',
    };

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { userName: { contains: params.search, mode: 'insensitive' } },
        { userEmail: { contains: params.search, mode: 'insensitive' } },
        { action: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
