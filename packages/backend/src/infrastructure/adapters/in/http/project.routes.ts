import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectTeamUseCase,
  ListProjectsUseCase,
  SaveProjectTeamUseCase,
  UpdateProjectUseCase,
} from '@application/ports/in/project.use-cases';
import {
  requireAdmin,
  requireEditor,
  requireProjectManager,
} from '@infrastructure/adapters/in/http/auth/auth-plugin';
import {
  createProjectBodySchema,
  projectTeamBodySchema,
} from '@infrastructure/adapters/in/http/schemas/create-project.schema';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';

export interface ProjectRoutesDeps {
  listProjects: ListProjectsUseCase;
  createProject: CreateProjectUseCase;
  updateProject: UpdateProjectUseCase;
  deleteProject: DeleteProjectUseCase;
  getProjectTeam: GetProjectTeamUseCase;
  saveProjectTeam: SaveProjectTeamUseCase;
}

/** Adaptateur ENTRANT HTTP : registre des projets (liste, création, modification, suppression) et équipes. */
export function projectRoutes(deps: ProjectRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    // Projets visibles du compte, avec ses droits sur chacun.
    app.get('/api/v1/projects', async (request) => deps.listProjects.execute({ requester: request.user }));

    // Création d'un projet (EDITOR+) : son créateur en devient le chef de projet.
    app.post('/api/v1/projects', { preHandler: requireEditor }, async (request, reply) => {
      const input = createProjectBodySchema.parse(request.body);
      const created = await deps.createProject.execute({ input, requester: request.user });
      return reply.status(201).send(created);
    });

    // Modification du nom, de la description et du statut (chef de projet) : mêmes règles qu'à la création.
    app.put('/api/v1/projects/:projectId', { preHandler: requireProjectManager }, async (request) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const input = createProjectBodySchema.parse(request.body);
      return deps.updateProject.execute({ projectId, input });
    });

    // Suppression d'un projet et de ses données (ADMIN uniquement).
    app.delete(
      '/api/v1/projects/:projectId',
      { preHandler: requireAdmin },
      async (request, reply) => {
        const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
        await deps.deleteProject.execute({ projectId });
        return reply.status(204).send();
      },
    );

    // Équipe : consultée par tout membre, gérée par le chef de projet.
    app.get('/api/v1/projects/:projectId/members', async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return deps.getProjectTeam.execute({ projectId, manages: request.projectRole === 'MANAGER' });
    });

    app.put('/api/v1/projects/:projectId/members', { preHandler: requireProjectManager }, async (request) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const input = projectTeamBodySchema.parse(request.body);
      return deps.saveProjectTeam.execute({ projectId, input });
    });
  };
}
