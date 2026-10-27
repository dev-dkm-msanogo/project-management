import type { FastifyPluginAsync } from 'fastify';
import type {
  GetEarnedValueUseCase,
  GetMyTasksUseCase,
  GetPortfolioUseCase,
  UpdateTaskProgressUseCase,
} from '@application/ports/in/performance.use-cases';
import {
  earnedValueQuerySchema,
  taskProgressBodySchema,
  taskProgressParamsSchema,
} from '@infrastructure/adapters/in/http/schemas/performance.schema';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';

export interface PerformanceRoutesDeps {
  updateTaskProgress: UpdateTaskProgressUseCase;
  getMyTasks: GetMyTasksUseCase;
  getEarnedValue: GetEarnedValueUseCase;
  getPortfolio: GetPortfolioUseCase;
}

/**
 * Adaptateur ENTRANT HTTP du pilotage : avancement d'une tâche (la personne affectée ou un
 * éditeur : le cas d'usage vérifie l'affectation), « Mes tâches », valeur acquise, portefeuille.
 * Données vivantes : jamais mises en cache.
 */
export function performanceRoutes(deps: PerformanceRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    app.put('/api/v1/projects/:projectId/tasks/:wbs/progress', async (request) => {
      const { projectId, wbs } = taskProgressParamsSchema.parse(request.params);
      const input = taskProgressBodySchema.parse(request.body);
      return deps.updateTaskProgress.execute({ projectId, wbs, input, actor: { id: request.user.id, role: request.user.role } });
    });

    app.get('/api/v1/me/tasks', async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      return deps.getMyTasks.execute({ requester: request.user });
    });

    app.get('/api/v1/projects/:projectId/earned-value', async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const { statusDate } = earnedValueQuerySchema.parse(request.query);
      reply.header('Cache-Control', 'no-store');
      return deps.getEarnedValue.execute({ projectId, statusDate });
    });

    app.get('/api/v1/portfolio', async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      return deps.getPortfolio.execute({ requester: request.user });
    });
  };
}
