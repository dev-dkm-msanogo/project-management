import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { GetAuditLogUseCase } from '@application/ports/in/governance.use-cases';
import { requireAdmin } from '@infrastructure/adapters/in/http/auth/auth-plugin';

const auditQuerySchema = z.object({
  before: z.coerce.number().int().positive().optional(),
  projectId: z.string().trim().min(1).max(100).optional(),
});

/** Adaptateur ENTRANT HTTP : journal d'audit de la plateforme, réservé aux administrateurs. */
export function governanceRoutes(deps: { getAuditLog: GetAuditLogUseCase }): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/v1/admin/audit', { preHandler: requireAdmin }, async (request, reply) => {
      const { before, projectId } = auditQuerySchema.parse(request.query);
      reply.header('Cache-Control', 'no-store');
      return deps.getAuditLog.execute({ projectId, before });
    });
  };
}
