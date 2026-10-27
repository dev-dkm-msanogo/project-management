import type { FastifyPluginAsync } from 'fastify';
import type {
  ResourceDirectoryAdministration,
  UserAdministration,
} from '@application/ports/in/admin.use-cases';
import { requireAdmin } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import {
  createUserBodySchema,
  directoryResourceBodySchema,
  resourceParamsSchema,
  updateUserBodySchema,
  userParamsSchema,
} from '@infrastructure/adapters/in/http/schemas/admin.schema';

export interface AdminRoutesDeps {
  users: UserAdministration;
  resources: ResourceDirectoryAdministration;
}

/**
 * Adaptateur ENTRANT HTTP de l'administration : comptes (ADMIN) et référentiel des
 * ressources (lecture pour tout utilisateur connecté, gestion ADMIN).
 */
export function adminRoutes(deps: AdminRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    const adminOnly = { preHandler: requireAdmin };

    // --- Comptes ---
    app.get('/api/v1/admin/users', adminOnly, async () => deps.users.list());

    app.post('/api/v1/admin/users', adminOnly, async (request, reply) => {
      const created = await deps.users.create({ input: createUserBodySchema.parse(request.body) });
      // Mot de passe provisoire dans la réponse : jamais mis en cache.
      return reply.status(201).header('Cache-Control', 'no-store').send(created);
    });

    app.put('/api/v1/admin/users/:userId', adminOnly, async (request) => {
      const { userId } = userParamsSchema.parse(request.params);
      return deps.users.update({
        actorId: request.user.id,
        userId,
        input: updateUserBodySchema.parse(request.body),
      });
    });

    app.post('/api/v1/admin/users/:userId/reset-password', adminOnly, async (request, reply) => {
      const { userId } = userParamsSchema.parse(request.params);
      const reset = await deps.users.resetPassword({ actorId: request.user.id, userId });
      return reply.header('Cache-Control', 'no-store').send(reset);
    });

    // --- Référentiel des ressources ---
    app.get('/api/v1/resources', async (request) => deps.resources.list());

    app.post('/api/v1/admin/resources', adminOnly, async (request, reply) => {
      const created = await deps.resources.create({ input: directoryResourceBodySchema.parse(request.body) });
      return reply.status(201).send(created);
    });

    app.put('/api/v1/admin/resources/:resourceId', adminOnly, async (request) => {
      const { resourceId } = resourceParamsSchema.parse(request.params);
      return deps.resources.update({ resourceId, input: directoryResourceBodySchema.parse(request.body) });
    });

    app.delete('/api/v1/admin/resources/:resourceId', adminOnly, async (request, reply) => {
      const { resourceId } = resourceParamsSchema.parse(request.params);
      await deps.resources.delete({ resourceId });
      return reply.status(204).send();
    });
  };
}
