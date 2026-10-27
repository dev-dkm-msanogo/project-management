import type { ApprovalSubject, DocumentApproval } from '@domain/entities/document-approval';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';

/**
 * Port SORTANT : historique de validation des documents d'un projet (un par document validé).
 * Chaque étape ajoute exactement un événement : le nombre d'événements lus sert de version.
 */
export interface ApprovalRepository extends ProjectScopedStore {
  find(projectId: string, subject: ApprovalSubject): Promise<DocumentApproval | null>;
  listByProject(projectId: string): Promise<DocumentApproval[]>;
  /** Enregistre si l'historique compte toujours `expectedEvents` événements, sinon ConflictError. */
  save(approval: DocumentApproval, expectedEvents: number): Promise<void>;
}

/** Version approuvée archivée : documents tels qu'ils ont été approuvés (lecture), par segment d'API. */
export interface ApprovalSnapshot {
  projectId: string;
  subject: ApprovalSubject;
  revision: number;
  documents: Record<string, unknown>;
}

/** Port SORTANT : versions approuvées, immuables une fois archivées. */
export interface ApprovalSnapshotRepository extends ProjectScopedStore {
  find(projectId: string, subject: ApprovalSubject, revision: number): Promise<ApprovalSnapshot | null>;
  /** Révisions archivées d'un document. */
  revisions(projectId: string, subject: ApprovalSubject): Promise<number[]>;
  /** Sans effet si cette version est déjà archivée. */
  save(snapshot: ApprovalSnapshot): Promise<void>;
}

/** Port SORTANT : valideurs désignés par projet (comptes utilisateurs). */
export interface ProjectApproverRepository extends ProjectScopedStore {
  listByProject(projectId: string): Promise<string[]>;
  /** Projets dont l'utilisateur est valideur. */
  listProjectsOf(userId: string): Promise<string[]>;
  replace(projectId: string, userIds: readonly string[]): Promise<void>;
}
