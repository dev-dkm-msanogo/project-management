import type { ProjectRecord } from '@domain/entities/project-record';
import type { ProjectRepository } from '@application/ports/out/project.repository';

/** Adaptateur SORTANT : registre des projets en mémoire. */
export class InMemoryProjectRepository implements ProjectRepository {
  private readonly byId = new Map<string, ProjectRecord>();

  constructor(seed: readonly ProjectRecord[] = []) {
    for (const record of seed) {
      this.byId.set(record.id, record);
    }
  }

  async list(): Promise<ProjectRecord[]> {
    return [...this.byId.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async save(record: ProjectRecord): Promise<void> {
    this.byId.set(record.id, record);
  }

  async delete(id: string): Promise<void> {
    this.byId.delete(id);
  }
}
