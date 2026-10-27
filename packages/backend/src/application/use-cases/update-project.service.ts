import { ProjectNotFoundError } from '@application/errors/application-errors';
import { toProjectRecordDto } from '@application/mappers/project-record-to-dto.mapper';
import type { UpdateProjectUseCase } from '@application/ports/in/project.use-cases';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { ProjectRecordDto, UpdateProjectInput } from '@shared/index';

/** Modifie le nom, la description et le statut d'un projet (son identifiant ne change pas) : chef de projet. */
export class UpdateProjectService implements UpdateProjectUseCase {
  constructor(private readonly repository: ProjectRepository) {}

  async execute(command: { projectId: string; input: UpdateProjectInput }): Promise<ProjectRecordDto> {
    const existing = await this.repository.findById(command.projectId);
    if (!existing) throw new ProjectNotFoundError(command.projectId);
    const updated = existing.withDetails(command.input);
    await this.repository.save(updated);
    return toProjectRecordDto(updated, 'MANAGER');
  }
}
