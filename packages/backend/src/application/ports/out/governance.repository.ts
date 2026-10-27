/** Ports SORTANTS de la gouvernance : historique des versions des documents, journal d'audit. */

export interface DocumentVersionEntry {
  version: number;
  savedAt: Date;
  /** Compte auteur (`null` : version antérieure à l'historique). */
  savedBy: string | null;
}

/** Historique des versions des documents d'un projet (`document` : clé de stockage du document). */
export interface DocumentVersionLog {
  list(document: string, projectId: string): Promise<{ current: number | null; versions: DocumentVersionEntry[] }>;
}

export interface AuditEventRecord {
  id: number;
  at: Date;
  userId: string | null;
  userName: string | null;
  projectId: string | null;
  action: string;
  detail: string | null;
}

export type NewAuditEvent = Omit<AuditEventRecord, 'id' | 'at'> & { ip: string | null };

/** Journal d'audit : on y ajoute, on n'y modifie ni n'y efface rien. */
export interface AuditLogRepository {
  record(event: NewAuditEvent): Promise<void>;
  /** Du plus récent au plus ancien ; `before` : identifiant à partir duquel reprendre (exclu). */
  list(filter: { projectId?: string; before?: number; limit: number }): Promise<AuditEventRecord[]>;
}
