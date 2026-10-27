import type { FastifyPluginAsync } from 'fastify';
import type {
  DeleteExecutiveReportUseCase,
  GetExecutiveReportUseCase,
  ListExecutiveReportsUseCase,
  PublishExecutiveReportUseCase,
  SaveExecutiveReportUseCase,
} from '@application/ports/in/executive-report.use-cases';
import { requireEditor, requireProjectManager } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import { expectedVersionOf, sendVersion } from '@infrastructure/adapters/in/http/document-version';
import { withDocumentScope } from '@infrastructure/concurrency/document-scope';
import {
  executiveReportParamsSchema,
  getExecutiveReportParamsSchema,
} from '@infrastructure/adapters/in/http/schemas/report.schema';
import { saveReportBodySchema } from '@infrastructure/adapters/in/http/schemas/save-report.schema';

export interface ReportRoutesDeps {
  listExecutiveReports: ListExecutiveReportsUseCase;
  getExecutiveReport: GetExecutiveReportUseCase;
  saveExecutiveReport: SaveExecutiveReportUseCase;
  publishExecutiveReport: PublishExecutiveReportUseCase;
  deleteExecutiveReport: DeleteExecutiveReportUseCase;
}

const TABLE = 'executive_status_reports';
const REPORTS = '/api/v1/projects/:projectId/executive-reports';

/**
 * Adaptateur ENTRANT HTTP : rapports exécutifs, un par mois. Les rédacteurs écrivent le brouillon du
 * mois ; le chef de projet le publie, et il est alors figé dans l'historique.
 */
export function reportRoutes(deps: ReportRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    app.get(REPORTS, async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return deps.listExecutiveReports.execute({ projectId });
    });

    app.get(`${REPORTS}/:period`, async (request, reply) => {
      const { projectId, period } = executiveReportParamsSchema.parse(request.params);
      const { result, version } = await withDocumentScope(TABLE, undefined, () =>
        deps.getExecutiveReport.execute({ projectId, period }),
      );
      sendVersion(reply, version);
      return result;
    });

    app.put(`${REPORTS}/:period`, { preHandler: requireEditor }, async (request, reply) => {
      const { projectId, period } = executiveReportParamsSchema.parse(request.params);
      const input = saveReportBodySchema.parse(request.body);
      const { result, version } = await withDocumentScope(TABLE, expectedVersionOf(request), () =>
        deps.saveExecutiveReport.execute({ projectId, period, input }),
      );
      sendVersion(reply, version);
      return reply.status(200).send(result);
    });

    app.post(`${REPORTS}/:period/publish`, { preHandler: requireProjectManager }, async (request) => {
      const { projectId, period } = executiveReportParamsSchema.parse(request.params);
      return deps.publishExecutiveReport.execute({ projectId, period, actorId: request.user.id });
    });

    app.delete(`${REPORTS}/:period`, { preHandler: requireEditor }, async (request, reply) => {
      const { projectId, period } = executiveReportParamsSchema.parse(request.params);
      await withDocumentScope(TABLE, expectedVersionOf(request), () =>
        deps.deleteExecutiveReport.execute({ projectId, period }),
      );
      return reply.status(204).send();
    });
  };
}
