import { ProjectTeam, type ProjectMember } from '@domain/entities/project-team';
import type { ProjectRole } from '@domain/value-objects/project-role';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';

/** Adaptateur SORTANT en mémoire (repli sans base) : membres des projets. */
export class InMemoryProjectMemberRepository implements ProjectMemberRepository {
  private readonly byProject = new Map<string, readonly ProjectMember[]>();

  constructor(seed: readonly ProjectTeam[] = []) {
    for (const team of seed) this.byProject.set(team.projectId, team.members);
  }

  async listByProject(projectId: string): Promise<ProjectMember[]> {
    return [...(this.byProject.get(projectId) ?? [])];
  }

  async listByUser(userId: string): Promise<{ projectId: string; role: ProjectRole }[]> {
    return [...this.byProject.entries()].flatMap(([projectId, members]) =>
      members.filter((member) => member.userId === userId).map((member) => ({ projectId, role: member.role })),
    );
  }

  async replace(team: ProjectTeam): Promise<void> {
    this.byProject.set(team.projectId, team.members);
  }

  async delete(projectId: string): Promise<void> {
    this.byProject.delete(projectId);
  }
}
