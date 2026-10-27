import type {
  AuditEntry,
  GetAuditLogUseCase,
  ListDocumentVersionsUseCase,
  RecordAuditEventUseCase,
} from '@application/ports/in/governance.use-cases';
import type { AuditLogRepository, DocumentVersionLog } from '@application/ports/out/governance.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { AuditLogDto, DocumentVersionsDto } from '@shared/index';

/** Historique d'un document : chaque version enregistrée, son auteur et sa date. */
export class ListDocumentVersionsService implements ListDocumentVersionsUseCase {
  constructor(
    private readonly log: DocumentVersionLog,
    private readonly users: UserRepository,
  ) {}

  async execute(query: { document: string; projectId: string }): Promise<DocumentVersionsDto> {
    const [{ current, versions }, users] = await Promise.all([
      this.log.list(query.document, query.projectId),
      this.users.list(),
    ]);
    const names = new Map(users.map((user) => [user.id, user.name]));
    return {
      versions: versions.map(({ version, savedAt, savedBy }) => ({
        version,
        savedAt: savedAt.toISOString(),
        savedBy: savedBy ? (names.get(savedBy) ?? savedBy) : null,
        current: version === current,
      })),
    };
  }
}

/** Trace une action : le nom du compte est figé dans le journal (il survit à un renommage). */
export class RecordAuditEventService implements RecordAuditEventUseCase {
  constructor(
    private readonly audit: AuditLogRepository,
    private readonly users: UserRepository,
  ) {}

  async execute({ actor, ...entry }: AuditEntry): Promise<void> {
    const user = actor.userId
      ? await this.users.findById(actor.userId)
      : actor.email
        ? await this.users.findByEmail(actor.email)
        : null;
    await this.audit.record({ ...entry, userId: user?.id ?? actor.userId, userName: user?.name ?? null });
  }
}

const AUDIT_PAGE = 100;

/** Journal d'audit, par pages du plus récent au plus ancien ; le nom courant du projet en clair. */
export class GetAuditLogService implements GetAuditLogUseCase {
  constructor(
    private readonly audit: AuditLogRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(query: { projectId?: string; before?: number }): Promise<AuditLogDto> {
    const [events, projects] = await Promise.all([
      this.audit.list({ projectId: query.projectId, before: query.before, limit: AUDIT_PAGE }),
      this.projects.list(),
    ]);
    const names = new Map(projects.map((project) => [project.id, project.name]));
    return {
      events: events.map((event) => ({
        id: event.id,
        at: event.at.toISOString(),
        userName: event.userName,
        projectId: event.projectId,
        projectName: event.projectId ? (names.get(event.projectId) ?? null) : null,
        action: event.action,
        detail: event.detail,
      })),
      nextBefore: events.length === AUDIT_PAGE ? events.at(-1)!.id : null,
    };
  }
}
