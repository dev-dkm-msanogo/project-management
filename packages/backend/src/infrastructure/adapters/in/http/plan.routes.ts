import type { FastifyPluginAsync } from 'fastify';
import type { GetProjectPlanUseCase } from '@application/ports/in/get-project-plan.use-case';
import type { ListDocumentVersionsUseCase } from '@application/ports/in/governance.use-cases';
import type { SaveProjectPlanUseCase } from '@application/ports/in/save-project-plan.use-case';
import type { PreviewScheduleService } from '@application/use-cases/schedule-model.services';
import { requireEditor } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import {
  expectedVersionOf,
  readDocument,
  registerVersionsRoute,
  sendVersion,
} from '@infrastructure/adapters/in/http/document-version';
import { withDocumentScope } from '@infrastructure/concurrency/document-scope';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';
import { savePlanBodySchema } from '@infrastructure/adapters/in/http/schemas/save-plan.schema';
import { saveScheduleModelBodySchema } from '@infrastructure/adapters/in/http/schemas/save-schedule-model.schema';

export interface PlanRoutesDeps {
  getProjectPlan: GetProjectPlanUseCase;
  saveProjectPlan: SaveProjectPlanUseCase;
  listDocumentVersions: ListDocumentVersionsUseCase;
  previewSchedule: PreviewScheduleService;
}

/** Adaptateur ENTRANT HTTP : routes du plan de projet (WBS). */
export function planRoutes(deps: PlanRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/v1/projects/:projectId/plan', async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      return readDocument(request, reply, 'project_plans', deps.listDocumentVersions, () =>
        deps.getProjectPlan.execute({ projectId }),
      );
    });
    registerVersionsRoute(app, '/api/v1/projects/:projectId/plan', 'project_plans', deps.listDocumentVersions);

    // Aperçu d'un modèle d'ordonnancement modifié (Gantt) : réseau et dates de la WBS, sans enregistrer.
    app.post('/api/v1/projects/:projectId/schedule-model/preview', { preHandler: requireEditor }, async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const input = saveScheduleModelBodySchema.parse(request.body);
      reply.header('Cache-Control', 'no-store');
      return deps.previewSchedule.execute({ projectId, input });
    });

    app.put(
      '/api/v1/projects/:projectId/plan',
      { preHandler: requireEditor },
      async (request, reply) => {
        const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
        const input = savePlanBodySchema.parse(request.body);
        const { result, version } = await withDocumentScope('project_plans', expectedVersionOf(request), () =>
          deps.saveProjectPlan.execute({ projectId, input }),
        );
        sendVersion(reply, version);
        return reply.status(200).send(result);
      },
    );
  };
}
