import { ProjectNotFoundError } from '@application/errors/application-errors';
import type {
  DeleteProjectCommand,
  DeleteProjectUseCase,
} from '@application/ports/in/project.use-cases';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';

/**
 * Supprime un projet et, en cascade, toutes ses données (rapport, plan, charte,
 * registres…) : pas d'orphelins. Un nouveau document s'ajoute à `dependents`.
 */
export class DeleteProjectService implements DeleteProjectUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly dependents: readonly ProjectScopedStore[],
  ) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    const existing = await this.projects.findById(command.projectId);
    if (!existing) {
      throw new ProjectNotFoundError(command.projectId);
    }
    for (const store of this.dependents) {
      await store.delete(command.projectId);
    }
    await this.projects.delete(command.projectId);
  }
}
