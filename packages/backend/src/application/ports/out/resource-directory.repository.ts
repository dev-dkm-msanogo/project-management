import type { DirectoryResource } from '@domain/entities/directory-resource';

/** Port SORTANT : référentiel des ressources de l'organisation. */
export interface ResourceDirectoryRepository {
  list(): Promise<DirectoryResource[]>;
  findById(id: string): Promise<DirectoryResource | null>;
  save(resource: DirectoryResource): Promise<void>;
  delete(id: string): Promise<void>;
}
