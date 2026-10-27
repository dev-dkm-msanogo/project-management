import type { AuditLogDto, DocumentVersionsDto } from '@shared/index';

/** Ports ENTRANTS de la gouvernance. */

export interface ListDocumentVersionsUseCase {
  execute(query: { document: string; projectId: string }): Promise<DocumentVersionsDto>;
}

/** Action à tracer : le compte qui agit (session, ou e-mail saisi à la connexion) et ce qu'il a fait. */
export interface AuditEntry {
  actor: { userId: string | null; email: string | null };
  projectId: string | null;
  action: string;
  detail: string | null;
  ip: string | null;
}

export interface RecordAuditEventUseCase {
  execute(entry: AuditEntry): Promise<void>;
}

export interface GetAuditLogUseCase {
  /** Sans projet : tout le journal (administrateurs). */
  execute(query: { projectId?: string; before?: number }): Promise<AuditLogDto>;
}
