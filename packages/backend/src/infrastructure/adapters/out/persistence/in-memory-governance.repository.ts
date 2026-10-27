import type {
  AuditEventRecord,
  AuditLogRepository,
  DocumentVersionLog,
  NewAuditEvent,
} from '@application/ports/out/governance.repository';

/** Repli sans base : pas d'historique des versions (seule la version courante existe). */
export class InMemoryDocumentVersionLog implements DocumentVersionLog {
  async list() {
    return { current: null, versions: [] };
  }
}

/** Repli sans base : journal d'audit en mémoire. */
export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly events: AuditEventRecord[] = [];

  async record(event: NewAuditEvent): Promise<void> {
    const { ip: _ip, ...rest } = event;
    this.events.push({ ...rest, id: this.events.length + 1, at: new Date() });
  }

  async list(filter: { projectId?: string; before?: number; limit: number }): Promise<AuditEventRecord[]> {
    return this.events
      .filter((event) => (!filter.projectId || event.projectId === filter.projectId) && (!filter.before || event.id < filter.before))
      .reverse()
      .slice(0, filter.limit);
  }
}
