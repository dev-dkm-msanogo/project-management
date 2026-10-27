import { ChangeLog } from '@domain/entities/change-log';
import { APPROVAL_SUBJECTS } from '@domain/entities/document-approval';
import { SourceSelections } from '@domain/entities/source-selections';
import { ConflictError, ForbiddenError } from '@application/errors/application-errors';
import { changeLogToInput } from '@application/mappers/change-log.mappers';
import { sourceSelectionsToInput } from '@application/mappers/procurement.mappers';
import type {
  ApprovalActor,
  AwardSourceSelectionUseCase,
  DecideChangeRequestUseCase,
  GetMyApprovalsUseCase,
} from '@application/ports/in/approval.use-cases';
import type { ApprovalRepository, ProjectApproverRepository } from '@application/ports/out/approval.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import { SUBJECT_NAMES } from '@application/use-cases/approval.services';
import { canonicalJson } from '@application/use-cases/canonical-json';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ToDto } from '@application/use-cases/project-document.services';
import type {
  ChangeDecisionInput,
  ChangeLogDto,
  ChangeRequestInput,
  PendingApprovalDto,
  SourceSelectionAwardInput,
  SourceSelectionsDto,
} from '@shared/index';

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);
const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Les décisions reviennent aux valideurs désignés pour le projet (comité de contrôle). */
async function assertApprover(approvers: ProjectApproverRepository, projectId: string, actor: ApprovalActor) {
  if (!(await approvers.listByProject(projectId)).includes(actor.id)) {
    throw new ForbiddenError('Seuls les valideurs désignés pour ce projet prennent cette décision.');
  }
}

async function nameOf(users: UserRepository, actor: ApprovalActor): Promise<string> {
  return (await users.findById(actor.id))?.name ?? actor.id;
}

// --- Demandes de modification ---

const decisionOf = (request: ChangeRequestInput) => ({
  disposition: request.disposition,
  decidedOn: request.decidedOn,
  decidedBy: request.decidedBy,
  decisionRationale: request.decisionRationale,
});

/** Décision d'une nouvelle demande : aucune. */
const NO_DECISION = { disposition: null, decidedOn: null, decidedBy: '', decisionRationale: '' };

/** Contenu d'une demande décidée : seuls son statut (mise en œuvre, clôture) et les commentaires évoluent. */
const decidedContentOf = ({ status: _status, comments: _comments, ...content }: ChangeRequestInput) => content;

/**
 * Contrôle de l'enregistrement du registre par un éditeur : la décision n'y est jamais saisie,
 * une demande décidée reste au registre et ne change plus (sauf statut et commentaires).
 */
export function changeDecisionGuard(changeLogs: ProjectDocumentRepository<ChangeLog>) {
  return async (next: ChangeLog): Promise<void> => {
    const current = await changeLogs.findByProjectId(next.projectId);
    const before = current ? changeLogToInput(current).requests : [];
    const after = changeLogToInput(next).requests;
    for (const request of after) {
      const previous = before.find((item) => sameName(item.code, request.code));
      const expected = previous ? decisionOf(previous) : NO_DECISION;
      if (canonicalJson(decisionOf(request)) !== canonicalJson(expected)) {
        throw new ConflictError(
          `${request.code} : la décision appartient aux valideurs du projet ; elle ne se saisit pas dans le registre.`,
        );
      }
      if (previous?.disposition && canonicalJson(decidedContentOf(previous)) !== canonicalJson(decidedContentOf(request))) {
        throw new ConflictError(`${request.code} est décidée : son contenu ne change plus (seuls le statut et les commentaires évoluent).`);
      }
    }
    const removed = before.find((item) => item.disposition && !after.some((request) => sameName(request.code, item.code)));
    if (removed) {
      throw new ConflictError(`${removed.code} est décidée : elle reste au registre des modifications.`);
    }
  };
}

/** Décision d'un valideur : approuvée, reportée ou rejetée, motivée, datée du jour. */
export class DecideChangeRequestService implements DecideChangeRequestUseCase {
  constructor(
    private readonly changeLogs: ProjectDocumentRepository<ChangeLog>,
    private readonly approvers: ProjectApproverRepository,
    private readonly users: UserRepository,
    private readonly toDto: ToDto<ChangeLog, ChangeLogDto>,
    private readonly clock: () => Date,
  ) {}

  async execute(command: {
    projectId: string;
    code: string;
    input: ChangeDecisionInput;
    actor: ApprovalActor;
  }): Promise<ChangeLogDto> {
    const { projectId, code, input, actor } = command;
    await assertApprover(this.approvers, projectId, actor);
    const by = await nameOf(this.users, actor);
    const log = await loadOrEmpty(this.changeLogs, projectId, ChangeLog.empty);
    const next = log.withDecision(code, (request) =>
      request.decide({ disposition: input.disposition, rationale: input.rationale, by, on: new Date(isoDay(this.clock())) }),
    );
    await this.changeLogs.save(next);
    return this.toDto(next);
  }
}

// --- Sélection des fournisseurs ---

/** Contrôle de l'enregistrement des grilles : l'attribution ne se saisit pas, une grille attribuée est figée. */
export function awardGuard(sourceSelections: ProjectDocumentRepository<SourceSelections>) {
  return async (next: SourceSelections): Promise<void> => {
    const current = await sourceSelections.findByProjectId(next.projectId);
    const before = current ? sourceSelectionsToInput(current).evaluations : [];
    const after = sourceSelectionsToInput(next).evaluations;
    for (const evaluation of after) {
      const previous = before.find((item) => sameName(item.procurement, evaluation.procurement));
      if (canonicalJson(evaluation.award) !== canonicalJson(previous?.award ?? null)) {
        throw new ConflictError(
          `« ${evaluation.procurement} » : l'attribution appartient aux valideurs du projet ; elle ne se saisit pas dans la grille.`,
        );
      }
      if (previous?.award && canonicalJson(previous) !== canonicalJson(evaluation)) {
        throw new ConflictError(`« ${evaluation.procurement} » est attribué : sa grille ne change plus.`);
      }
    }
    const removed = before.find((item) => item.award && !after.some((evaluation) => sameName(evaluation.procurement, item.procurement)));
    if (removed) {
      throw new ConflictError(`« ${removed.procurement} » est attribué : sa grille reste au dossier.`);
    }
  };
}

/** Attribution d'un achat par un valideur, motivée, datée du jour. */
export class AwardSourceSelectionService implements AwardSourceSelectionUseCase {
  constructor(
    private readonly sourceSelections: ProjectDocumentRepository<SourceSelections>,
    private readonly approvers: ProjectApproverRepository,
    private readonly users: UserRepository,
    private readonly toDto: ToDto<SourceSelections, SourceSelectionsDto>,
    private readonly clock: () => Date,
  ) {}

  async execute(command: {
    projectId: string;
    input: SourceSelectionAwardInput;
    actor: ApprovalActor;
  }): Promise<SourceSelectionsDto> {
    const { projectId, input, actor } = command;
    await assertApprover(this.approvers, projectId, actor);
    const decidedBy = await nameOf(this.users, actor);
    const selections = await loadOrEmpty(this.sourceSelections, projectId, SourceSelections.empty);
    const next = selections.withAward(input.procurement, {
      supplier: input.supplier,
      rationale: input.rationale,
      decidedBy,
      decidedOn: new Date(isoDay(this.clock())),
    });
    await this.sourceSelections.save(next);
    return this.toDto(next);
  }
}

// --- À valider ---

/**
 * Ce qui attend une décision de l'utilisateur dans les projets dont il est valideur : versions
 * soumises (sauf les siennes), demandes de modification à décider, achats à attribuer.
 */
export class GetMyApprovalsService implements GetMyApprovalsUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly approvers: ProjectApproverRepository,
    private readonly approvals: ApprovalRepository,
    private readonly changeLogs: ProjectDocumentRepository<ChangeLog>,
    private readonly sourceSelections: ProjectDocumentRepository<SourceSelections>,
  ) {}

  async execute(query: { actor: ApprovalActor }): Promise<PendingApprovalDto[]> {
    const projectIds = await this.approvers.listProjectsOf(query.actor.id);
    const perProject = await Promise.all(projectIds.map((projectId) => this.pendingIn(projectId, query.actor)));
    return perProject.flat();
  }

  private async pendingIn(projectId: string, actor: ApprovalActor): Promise<PendingApprovalDto[]> {
    const [project, approvals, log, selections] = await Promise.all([
      this.projects.findById(projectId),
      this.approvals.listByProject(projectId),
      this.changeLogs.findByProjectId(projectId),
      this.sourceSelections.findByProjectId(projectId),
    ]);
    if (!project) return [];
    const base = { projectId, projectName: project.name };
    const documents: PendingApprovalDto[] = approvals
      .filter((approval) => approval.status === 'SUBMITTED' && approval.currentSubmission?.by.id !== actor.id)
      .sort((a, b) => APPROVAL_SUBJECTS.indexOf(a.subject) - APPROVAL_SUBJECTS.indexOf(b.subject))
      .map((approval) => {
        const submission = approval.currentSubmission!;
        const name = SUBJECT_NAMES[approval.subject];
        return {
          ...base,
          kind: 'DOCUMENT',
          subject: approval.subject,
          reference: `Version ${approval.revision}`,
          title: name.charAt(0).toUpperCase() + name.slice(1),
          submittedAt: submission.at.toISOString(),
          submittedBy: submission.by.name,
        };
      });
    const requests: PendingApprovalDto[] = (log?.requests ?? [])
      .filter((request) => request.awaitsDecision)
      .map((request) => ({
        ...base,
        kind: 'CHANGE_REQUEST',
        subject: null,
        reference: request.code,
        title: request.props.title,
        submittedAt: request.props.submittedOn.toISOString(),
        submittedBy: request.props.requestor,
      }));
    const purchases: PendingApprovalDto[] = (selections?.evaluations ?? [])
      .filter((evaluation) => !evaluation.props.award)
      .map((evaluation) => ({
        ...base,
        kind: 'SOURCE_SELECTION',
        subject: null,
        reference: evaluation.props.procurement,
        title: `Attribuer l'achat « ${evaluation.props.procurement} »`,
        submittedAt: evaluation.props.preparedOn.toISOString(),
        submittedBy: null,
      }));
    return [...documents, ...requests, ...purchases];
  }
}
