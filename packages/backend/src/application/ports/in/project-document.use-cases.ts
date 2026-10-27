/** Ports ENTRANTS génériques d'un document de projet rédigé (business case, plan, matrice…). */

/** Obtenir le document ; introuvable s'il n'a jamais été rédigé. */
export interface GetProjectDocumentUseCase<Dto> {
  execute(query: { projectId: string }): Promise<Dto>;
}

/** Créer ou remplacer le document. */
export interface SaveProjectDocumentUseCase<Input, Dto> {
  execute(command: { projectId: string; input: Input }): Promise<Dto>;
}

/** Supprimer le document entier ; introuvable s'il n'existe pas (ou plus). */
export interface DeleteProjectDocumentUseCase {
  execute(command: { projectId: string }): Promise<void>;
}
