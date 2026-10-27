import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Document persisté du projet, ou document vide s'il n'a encore jamais été saisi. */
export async function loadOrEmpty<T>(
  repository: ProjectDocumentRepository<T>,
  projectId: string,
  empty: (projectId: string) => T,
): Promise<T> {
  return (await repository.findByProjectId(projectId)) ?? empty(projectId);
}
