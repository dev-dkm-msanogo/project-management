import {
  APPROVAL_SUBJECTS,
  DocumentApproval,
  type ApprovalActor as EventAuthor,
  type ApprovalSubject,
} from '@domain/entities/document-approval';
import type { ChangeLog } from '@domain/entities/change-log';
import { DomainError } from '@domain/errors/domain-errors';
import { canEditContent } from '@domain/value-objects/role';
import { ConflictError, ForbiddenError, NotFoundError } from '@application/errors/application-errors';
import { toApprovalDto } from '@application/mappers/approval.mappers';
import type {
  ActOnApprovalUseCase,
  ApprovalActor,
  GetApprovalSnapshotUseCase,
  GetProjectApprovalsUseCase,
  SetProjectApproversUseCase,
} from '@application/ports/in/approval.use-cases';
import type {
  ApprovalRepository,
  ApprovalSnapshotRepository,
  ProjectApproverRepository,
} from '@application/ports/out/approval.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import { canonicalJson } from '@application/use-cases/canonical-json';
import type {
  ApprovalAction,
  ApprovalSnapshotDto,
  ProjectApprovalsDto,
  ProjectApproverDto,
} from '@shared/index';

/** Nom du document dans les messages (après « de » ou entre parenthèses). */
export const SUBJECT_NAMES: Record<ApprovalSubject, string> = {
  BUSINESS_CASE: 'le business case',
  CHARTER: 'la charte du projet',
  BENEFITS_PLAN: 'le plan de gestion des bénéfices',
  PROJECT_MANAGEMENT_PLAN: 'le plan de management du projet',
  REQUIREMENTS: 'le registre des exigences',
};

/** Ce que le circuit sait de chaque document validé, fourni par la racine de composition. */
export interface ApprovalSubjectSource {
  /** Ce qui manque pour soumettre (document absent, rubriques incomplètes…). */
  missingForSubmission(projectId: string): Promise<string[]>;
  /** Documents tels qu'ils seront approuvés (lecture), par segment d'API. */
  snapshot(projectId: string): Promise<Record<string, unknown>>;
  /** Ce que l'approbation fige en plus (références de base du plan de management). */
  archive?(projectId: string, revision: number, approvedAt: Date): Promise<void>;
}

export type ApprovalSources = Record<ApprovalSubject, ApprovalSubjectSource>;

// --- Verrou : une version soumise ou approuvée est figée ---

function lockMessage(approval: DocumentApproval, component: boolean): string {
  const name = SUBJECT_NAMES[approval.subject];
  const prefix = component ? 'Ce document fait partie du plan de management du projet. ' : '';
  if (approval.status === 'SUBMITTED') {
    return `${prefix}Version ${approval.revision} soumise à validation (${name}) : retirez la soumission pour modifier ce document.`;
  }
  return (
    `${prefix}Version ${approval.revision} approuvée (${name}) : révisez-la pour ouvrir la version ` +
    `${approval.revision + 1}, puis modifiez ce document.`
  );
}

/** Document gouverné par un circuit : ce que l'approbation fige (le suivi reste modifiable). */
export interface LockedDocument<T> {
  subject: ApprovalSubject;
  /** Composant du plan de management, validé avec lui. */
  component?: boolean;
  /** Contenu figé du document, comparé avant et après l'enregistrement. */
  frozen: (document: T) => unknown;
  projectIdOf: (document: T) => string;
}

/**
 * Dépôt verrouillé : refuse d'enregistrer un changement du contenu figé, ou de supprimer le
 * document, tant que sa version est soumise ou approuvée. Le suivi (affectations, jalons
 * atteints, avancement des exigences) reste libre ; un enregistrement à l'identique passe.
 */
export function lockedRepository<T>(
  repository: ProjectDocumentRepository<T>,
  approvals: ApprovalRepository,
  locked: LockedDocument<T>,
): ProjectDocumentRepository<T> {
  const lockOf = async (projectId: string): Promise<DocumentApproval | null> => {
    const approval = await approvals.find(projectId, locked.subject);
    return approval && !approval.editable ? approval : null;
  };
  return {
    findByProjectId: (projectId) => repository.findByProjectId(projectId),
    async save(document) {
      const projectId = locked.projectIdOf(document);
      const approval = await lockOf(projectId);
      if (approval) {
        const current = await repository.findByProjectId(projectId);
        if (!current || canonicalJson(locked.frozen(current)) !== canonicalJson(locked.frozen(document))) {
          throw new ConflictError(lockMessage(approval, locked.component ?? false));
        }
      }
      await repository.save(document);
    },
    async delete(projectId) {
      const approval = await lockOf(projectId);
      if (approval) {
        throw new ConflictError(lockMessage(approval, locked.component ?? false));
      }
      await repository.delete(projectId);
    },
  };
}

// --- Lecture et actions ---

interface ApprovalDeps {
  approvals: ApprovalRepository;
  approvers: ProjectApproverRepository;
  snapshots: ApprovalSnapshotRepository;
  users: UserRepository;
  sources: ApprovalSources;
  /** Registre des modifications : une révision du plan de management en cite une demande approuvée. */
  changeLogs: ProjectDocumentRepository<ChangeLog>;
}

const NO_APPROVER = "un valideur désigné pour le projet (à demander à un administrateur)";

/** Actions permises : le chef de projet (éditeur) soumet, retire, révise ; un valideur décide. */
function allowedActions(approval: DocumentApproval, actor: ApprovalActor, approverIds: readonly string[], ready: boolean) {
  const editor = canEditContent(actor.role);
  const decider = approverIds.includes(actor.id) && approval.currentSubmission?.by.id !== actor.id;
  const actions: ApprovalAction[] = [];
  if (approval.status === 'DRAFT' && editor && ready) actions.push('SUBMIT');
  if (approval.status === 'SUBMITTED' && editor) actions.push('WITHDRAW');
  if (approval.status === 'SUBMITTED' && decider) actions.push('APPROVE', 'REJECT');
  if (approval.status === 'APPROVED' && editor) actions.push('REVISE');
  return actions;
}

async function missingOf(deps: ApprovalDeps, projectId: string, subject: ApprovalSubject, approverIds: readonly string[]) {
  const missing = await deps.sources[subject].missingForSubmission(projectId);
  return approverIds.length === 0 ? [...missing, NO_APPROVER] : missing;
}

async function approversOf(deps: ApprovalDeps, projectId: string): Promise<ProjectApproverDto[]> {
  const ids = await deps.approvers.listByProject(projectId);
  const users = await Promise.all(ids.map((id) => deps.users.findById(id)));
  return users
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .map((user) => ({ id: user.id, name: user.name, active: user.active }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/** États de validation des documents d'un projet, et ce que l'utilisateur peut y faire. */
export class GetProjectApprovalsService implements GetProjectApprovalsUseCase {
  constructor(private readonly deps: ApprovalDeps) {}

  async execute(query: { projectId: string; actor: ApprovalActor }): Promise<ProjectApprovalsDto> {
    const { projectId, actor } = query;
    const [approvers, stored] = await Promise.all([
      approversOf(this.deps, projectId),
      this.deps.approvals.listByProject(projectId),
    ]);
    const approverIds = approvers.filter((approver) => approver.active).map((approver) => approver.id);
    const subjects = await Promise.all(
      APPROVAL_SUBJECTS.map(async (subject) => {
        const approval = stored.find((item) => item.subject === subject) ?? DocumentApproval.start(projectId, subject);
        const missing = approval.status === 'DRAFT' ? await missingOf(this.deps, projectId, subject, approverIds) : [];
        return toApprovalDto(approval, {
          actions: allowedActions(approval, actor, approverIds, missing.length === 0),
          missingForSubmission: missing,
          archivedRevisions: await this.deps.snapshots.revisions(projectId, subject),
        });
      }),
    );
    return { projectId, approvers, subjects };
  }
}

/**
 * Une étape du circuit. L'approbation archive les documents tels qu'approuvés ; une révision
 * archive d'abord la version de référence si elle ne l'est pas encore (versions reprises).
 */
export class ActOnApprovalService implements ActOnApprovalUseCase {
  constructor(
    private readonly deps: ApprovalDeps,
    private readonly read: GetProjectApprovalsUseCase,
    private readonly clock: () => Date,
  ) {}

  async execute(command: {
    projectId: string;
    subject: ApprovalSubject;
    action: ApprovalAction;
    comment: string | null;
    changeRequest?: string | null;
    actor: ApprovalActor;
  }): Promise<ProjectApprovalsDto> {
    const { projectId, subject, action, comment, actor } = command;
    const changeRequest = command.changeRequest?.trim() || null;
    const user = await this.deps.users.findById(actor.id);
    const author: EventAuthor = { id: actor.id, name: user?.name ?? actor.id };
    const approval = (await this.deps.approvals.find(projectId, subject)) ?? DocumentApproval.start(projectId, subject);
    const approverIds = (await approversOf(this.deps, projectId))
      .filter((approver) => approver.active)
      .map((approver) => approver.id);
    const now = this.clock();
    if (['SUBMIT', 'WITHDRAW', 'REVISE'].includes(action) && !canEditContent(actor.role)) {
      throw new ForbiddenError('Seul un éditeur du projet soumet, retire ou révise un document.');
    }
    if (['APPROVE', 'REJECT'].includes(action) && !approverIds.includes(actor.id)) {
      throw new ForbiddenError("Seuls les valideurs désignés pour ce projet décident d'une version soumise.");
    }

    let next: DocumentApproval;
    switch (action) {
      case 'SUBMIT': {
        if (approval.status === 'DRAFT') {
          const missing = await missingOf(this.deps, projectId, subject, approverIds);
          if (missing.length > 0) {
            throw new DomainError(`Pour soumettre ${SUBJECT_NAMES[subject]}, il manque : ${missing.join(', ')}.`);
          }
        }
        next = approval.submit(author, now, comment);
        break;
      }
      case 'WITHDRAW':
        next = approval.withdraw(author, now, comment);
        break;
      case 'APPROVE':
        next = approval.approve(author, now, comment, approverIds);
        await this.archive(projectId, subject, next.revision, now);
        break;
      case 'REJECT':
        next = approval.reject(author, now, comment, approverIds);
        break;
      case 'REVISE': {
        if (subject === 'PROJECT_MANAGEMENT_PLAN') await this.assertApprovedChange(projectId, changeRequest);
        const reference = approval.lastApproval;
        if (reference) await this.archive(projectId, subject, reference.revision, reference.at);
        next = approval.revise(author, now, comment, subject === 'PROJECT_MANAGEMENT_PLAN' ? changeRequest : null);
        break;
      }
    }
    await this.deps.approvals.save(next, approval.events.length);
    return this.read.execute({ projectId, actor });
  }

  private async archive(projectId: string, subject: ApprovalSubject, revision: number, approvedAt: Date): Promise<void> {
    if ((await this.deps.snapshots.revisions(projectId, subject)).includes(revision)) return;
    const source = this.deps.sources[subject];
    const documents = await source.snapshot(projectId);
    await this.deps.snapshots.save({ projectId, subject, revision, documents });
    await source.archive?.(projectId, revision, approvedAt);
  }

  /**
   * Les références de base ne changent que par une demande de modification approuvée : la révision
   * du plan de management la cite.
   */
  private async assertApprovedChange(projectId: string, code: string | null): Promise<void> {
    if (!code) {
      throw new DomainError(
        'Pour réviser le plan de management, citez la demande de modification approuvée qui justifie la révision.',
      );
    }
    const log = await this.deps.changeLogs.findByProjectId(projectId);
    const request = log?.requests.find((item) => item.code.toLowerCase() === code.toLowerCase());
    if (!request) throw new DomainError(`Demande de modification introuvable : ${code}.`);
    if (request.props.disposition !== 'APPROVED') {
      throw new DomainError(`La demande ${request.code} n'est pas approuvée : elle ne peut pas justifier une révision.`);
    }
  }
}

/** Version approuvée archivée, à consulter telle qu'elle a été approuvée. */
export class GetApprovalSnapshotService implements GetApprovalSnapshotUseCase {
  constructor(
    private readonly approvals: ApprovalRepository,
    private readonly snapshots: ApprovalSnapshotRepository,
  ) {}

  async execute(query: { projectId: string; subject: ApprovalSubject; revision: number }): Promise<ApprovalSnapshotDto> {
    const { projectId, subject, revision } = query;
    const [snapshot, approval] = await Promise.all([
      this.snapshots.find(projectId, subject, revision),
      this.approvals.find(projectId, subject),
    ]);
    const approved = approval?.events.find((event) => event.type === 'APPROVED' && event.revision === revision);
    if (!snapshot || !approved) {
      throw new NotFoundError(`Aucune version ${revision} approuvée et archivée pour ${SUBJECT_NAMES[subject]}.`);
    }
    return {
      subject,
      revision,
      approvedAt: approved.at.toISOString(),
      approvedBy: { ...approved.by },
      documents: snapshot.documents,
    };
  }
}

/** Valideurs d'un projet : comptes actifs, sans doublon (désignés par un administrateur). */
export class SetProjectApproversService implements SetProjectApproversUseCase {
  constructor(
    private readonly approvers: ProjectApproverRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(command: { projectId: string; userIds: string[] }): Promise<ProjectApproverDto[]> {
    const ids = [...new Set(command.userIds)];
    const users = await Promise.all(ids.map((id) => this.users.findById(id)));
    const unknown = ids.filter((_, index) => !users[index]);
    if (unknown.length > 0) {
      throw new DomainError(`Compte inconnu : ${unknown.join(', ')}.`);
    }
    const inactive = users.filter((user) => user && !user.active).map((user) => user!.name);
    if (inactive.length > 0) {
      throw new DomainError(`Compte désactivé, ne peut pas valider : ${inactive.join(', ')}.`);
    }
    await this.approvers.replace(command.projectId, ids);
    return users
      .map((user) => ({ id: user!.id, name: user!.name, active: user!.active }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
}
