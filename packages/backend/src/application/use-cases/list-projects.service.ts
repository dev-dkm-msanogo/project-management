import { toProjectRecordDto } from '@application/mappers/project-record-to-dto.mapper';
import type { ListProjectsUseCase, Requester } from '@application/ports/in/project.use-cases';
import type { ProjectAccess } from '@application/use-cases/project-access.services';
import type { ProjectRecordDto } from '@shared/index';

/** Projets visibles du compte (membre, valideur ou administrateur), avec ses droits sur chacun. */
export class ListProjectsService implements ListProjectsUseCase {
  constructor(private readonly access: ProjectAccess) {}

  async execute(query: { requester: Requester }): Promise<ProjectRecordDto[]> {
    const visible = await this.access.visibleProjects(query.requester);
    return visible.map(({ project, access }) => toProjectRecordDto(project, access));
  }
}
