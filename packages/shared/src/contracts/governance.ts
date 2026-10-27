/** Contrats de la gouvernance : historique des versions d'un document et journal d'audit. */

export interface DocumentVersionDto {
  version: number;
  savedAt: string;
  /** Auteur de la version ; `null` : enregistrée avant l'historique ou hors session. */
  savedBy: string | null;
  /** Version en vigueur du document. */
  current: boolean;
}

export interface DocumentVersionsDto {
  versions: DocumentVersionDto[];
}

export interface AuditEventDto {
  id: number;
  at: string;
  /** Compte qui a agi (`null` : tentative de connexion inconnue). */
  userName: string | null;
  projectId: string | null;
  projectName: string | null;
  /** Ce qui a été fait, en clair (ex. « Charte du projet enregistrée (version 4) »). */
  action: string;
  detail: string | null;
}

export interface AuditLogDto {
  events: AuditEventDto[];
  /** Curseur de la page suivante (événements plus anciens) ; `null` : fin du journal. */
  nextBefore: number | null;
}
