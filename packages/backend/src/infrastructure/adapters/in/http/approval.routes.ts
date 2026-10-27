import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type {
  ActOnApprovalUseCase,
  ApprovalActor,
  AwardSourceSelectionUseCase,
  DecideChangeRequestUseCase,
  GetApprovalSnapshotUseCase,
  GetMyApprovalsUseCase,
  GetProjectApprovalsUseCase,
  SetProjectApproversUseCase,
} from '@application/ports/in/approval.use-cases';
import { requireAdmin } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import {
  approvalActionBodySchema,
  approvalActionParamsSchema,
  approvalSnapshotParamsSchema,
  projectApproversBodySchema,
} from '@infrastructure/adapters/in/http/schemas/approval.schema';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';
import {
  changeDecisionBodySchema,
  changeDecisionParamsSchema,
} from '@infrastructure/adapters/in/http/schemas/save-change-log.schema';
import { awardSourceSelectionBodySchema } from '@infrastructure/adapters/in/http/schemas/save-procurement-documents.schema';
import type { ApprovalAction, ApprovalSubject } from '@shared/index';

export interface ApprovalRoutesDeps {
  getProjectApprovals: GetProjectApprovalsUseCase;
  actOnApproval: ActOnApprovalUseCase;
  getApprovalSnapshot: GetApprovalSnapshotUseCase;
  setProjectApprovers: SetProjectApproversUseCase;
  getMyApprovals: GetMyApprovalsUseCase;
  decideChangeRequest: DecideChangeRequestUseCase;
  awardSourceSelection: AwardSourceSelectionUseCase;
}

const actorOf = (request: FastifyRequest): ApprovalActor => ({ id: request.user.id, role: request.user.role });

/**
 * Adaptateur ENTRANT HTTP du circuit de validation. Le rôle ne suffit pas à décider : les cas
 * d'usage vérifient que l'utilisateur est valideur du projet et n'a pas soumis la version.
 * Données vivantes : jamais mises en cache.
 */
export function approvalRoutes(deps: ApprovalRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/v1/projects/:projectId/approvals', async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return deps.getProjectApprovals.execute({ projectId, actor: actorOf(request) });
    });

    app.post('/api/v1/projects/:projectId/approvals/:subject/:action', async (request) => {
      const { projectId, subject, action } = approvalActionParamsSchema.parse(request.params);
      const { comment, changeRequest } = approvalActionBodySchema.parse(request.body ?? undefined);
      return deps.actOnApproval.execute({
        projectId,
        subject: subject as ApprovalSubject,
        action: action.toUpperCase() as ApprovalAction,
        comment,
        changeRequest,
        actor: actorOf(request),
      });
    });

    app.get('/api/v1/projects/:projectId/approvals/:subject/versions/:revision', async (request, reply) => {
      const { projectId, subject, revision } = approvalSnapshotParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return deps.getApprovalSnapshot.execute({ projectId, subject: subject as ApprovalSubject, revision });
    });

    // Désignation des valideurs d'un projet (ADMIN uniquement).
    app.put('/api/v1/projects/:projectId/approvers', { preHandler: requireAdmin }, async (request) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const { userIds } = projectApproversBodySchema.parse(request.body);
      return deps.setProjectApprovers.execute({ projectId, userIds });
    });

    app.get('/api/v1/me/approvals', async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      return deps.getMyApprovals.execute({ actor: actorOf(request) });
    });

    app.post('/api/v1/projects/:projectId/change-log/:code/decision', async (request) => {
      const { projectId, code } = changeDecisionParamsSchema.parse(request.params);
      const input = changeDecisionBodySchema.parse(request.body);
      return deps.decideChangeRequest.execute({ projectId, code, input, actor: actorOf(request) });
    });

    app.post('/api/v1/projects/:projectId/source-selections/award', async (request) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const input = awardSourceSelectionBodySchema.parse(request.body);
      return deps.awardSourceSelection.execute({ projectId, input, actor: actorOf(request) });
    });
  };
}
