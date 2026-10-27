import type { DirectoryResource } from '@domain/entities/directory-resource';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';

/** Adaptateur SORTANT : référentiel des ressources en mémoire. */
export class InMemoryResourceDirectoryRepository implements ResourceDirectoryRepository {
  private readonly byId = new Map<string, DirectoryResource>();

  constructor(seed: readonly DirectoryResource[] = []) {
    for (const resource of seed) this.byId.set(resource.id, resource);
  }

  async list(): Promise<DirectoryResource[]> {
    return [...this.byId.values()];
  }

  async findById(id: string): Promise<DirectoryResource | null> {
    return this.byId.get(id) ?? null;
  }

  async save(resource: DirectoryResource): Promise<void> {
    this.byId.set(resource.id, resource);
  }

  async delete(id: string): Promise<void> {
    this.byId.delete(id);
  }
}
