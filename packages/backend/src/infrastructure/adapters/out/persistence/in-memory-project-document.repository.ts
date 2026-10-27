import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Adaptateur SORTANT générique : un document par projet, en mémoire. */
export class InMemoryProjectDocumentRepository<T extends { readonly projectId: string }>
  implements ProjectDocumentRepository<T>
{
  private readonly byProjectId = new Map<string, T>();

  constructor(seed: readonly T[] = []) {
    for (const document of seed) {
      this.byProjectId.set(document.projectId, document);
    }
  }

  async findByProjectId(projectId: string): Promise<T | null> {
    return this.byProjectId.get(projectId) ?? null;
  }

  async save(document: T): Promise<void> {
    this.byProjectId.set(document.projectId, document);
  }

  async delete(projectId: string): Promise<void> {
    this.byProjectId.delete(projectId);
  }
}
