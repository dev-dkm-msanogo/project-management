import type { ProjectRecord } from '@domain/entities/project-record';

/** Port SORTANT : registre des projets. */
export interface ProjectRepository {
  list(): Promise<ProjectRecord[]>;
  findById(id: string): Promise<ProjectRecord | null>;
  save(record: ProjectRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
