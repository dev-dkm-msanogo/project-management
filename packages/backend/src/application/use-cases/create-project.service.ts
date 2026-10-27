import { ProjectRecord } from '@domain/entities/project-record';
import { ProjectTeam } from '@domain/entities/project-team';
import { toProjectRecordDto } from '@application/mappers/project-record-to-dto.mapper';
import type { CreateProjectUseCase, Requester } from '@application/ports/in/project.use-cases';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { CreateProjectInput, ProjectRecordDto } from '@shared/index';

/** Génère un identifiant « slug » lisible à partir d'un nom. */
function slugify(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'projet';
}

/** Crée un projet ; son créateur en devient le chef de projet. */
export class CreateProjectService implements CreateProjectUseCase {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly members: ProjectMemberRepository,
  ) {}

  async execute({ input, requester }: { input: CreateProjectInput; requester: Requester }): Promise<ProjectRecordDto> {
    // Identifiant unique : slug du nom, suffixé en cas de collision.
    const base = slugify(input.name);
    let id = base;
    let counter = 2;
    while (await this.repository.findById(id)) {
      id = `${base}-${counter}`;
      counter += 1;
    }

    const record = ProjectRecord.create({
      id,
      name: input.name,
      description: input.description,
      status: input.status,
    });
    await this.repository.save(record);
    await this.members.replace(ProjectTeam.create(id, [{ userId: requester.id, role: 'MANAGER' }]));
    return toProjectRecordDto(record, 'MANAGER');
  }
}
