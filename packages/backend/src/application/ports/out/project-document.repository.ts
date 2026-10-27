/** Données rattachées à un projet, supprimées avec lui (cascade). */
export interface ProjectScopedStore {
  delete(projectId: string): Promise<void>;
}

/**
 * Port SORTANT générique : un document (agrégat) par projet — registre des risques,
 * charte, registre des parties prenantes, registre des hypothèses et contraintes…
 */
export interface ProjectDocumentRepository<T> extends ProjectScopedStore {
  findByProjectId(projectId: string): Promise<T | null>;
  save(document: T): Promise<void>;
}
