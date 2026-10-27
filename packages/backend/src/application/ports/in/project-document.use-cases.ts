import type { ProjectRole } from '@domain/value-objects/project-role';

/** Ports ENTRANTS génériques d'un document de projet rédigé (business case, plan, matrice…). */

/** Compte qui enregistre, et son rôle sur le projet (certains documents répartissent les droits). */
export interface DocumentActor {
  id: string;
  projectRole: ProjectRole | null;
}

/** Obtenir le document ; introuvable s'il n'a jamais été rédigé. */
export interface GetProjectDocumentUseCase<Dto> {
  execute(query: { projectId: string }): Promise<Dto>;
}

/** Créer ou remplacer le document. */
export interface SaveProjectDocumentUseCase<Input, Dto> {
  execute(command: { projectId: string; input: Input; actor?: DocumentActor }): Promise<Dto>;
}

/** Supprimer le document entier ; introuvable s'il n'existe pas (ou plus). */
export interface DeleteProjectDocumentUseCase {
  execute(command: { projectId: string }): Promise<void>;
}
