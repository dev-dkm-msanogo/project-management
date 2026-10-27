import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId } from '@domain/value-objects/register-rules';

/** Documents soumis à validation ; le plan de management l'est avec ses plans et références. */
export const APPROVAL_SUBJECTS = [
  'BUSINESS_CASE',
  'CHARTER',
  'BENEFITS_PLAN',
  'PROJECT_MANAGEMENT_PLAN',
  'REQUIREMENTS',
] as const;
export type ApprovalSubject = (typeof APPROVAL_SUBJECTS)[number];

export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export const APPROVAL_EVENT_TYPES = ['SUBMITTED', 'WITHDRAWN', 'APPROVED', 'REJECTED', 'REVISED'] as const;
export type ApprovalEventType = (typeof APPROVAL_EVENT_TYPES)[number];

/** Auteur d'un événement ; `id` absent pour une saisie antérieure au circuit. */
export interface ApprovalActor {
  id: string | null;
  name: string;
}

export interface ApprovalEvent {
  type: ApprovalEventType;
  /** Version concernée ; un événement REVISED porte la nouvelle version. */
  revision: number;
  at: Date;
  by: ApprovalActor;
  comment: string | null;
  /** Révision : demande de modification approuvée qui la justifie (plan de management). */
  changeRequest?: string | null;
}

/** Un rejet dit au chef de projet quoi corriger. */
export const MIN_REJECTION_COMMENT = 10;
const MAX_COMMENT = 2000;

export function isApprovalSubject(value: string): value is ApprovalSubject {
  return (APPROVAL_SUBJECTS as readonly string[]).includes(value);
}

/** État courant obtenu en rejouant l'historique (chaque événement doit être permis à son tour). */
interface ApprovalState {
  status: ApprovalStatus;
  revision: number;
}

const TRANSITIONS: Record<ApprovalEventType, { from: ApprovalStatus; to: ApprovalStatus }> = {
  SUBMITTED: { from: 'DRAFT', to: 'SUBMITTED' },
  WITHDRAWN: { from: 'SUBMITTED', to: 'DRAFT' },
  APPROVED: { from: 'SUBMITTED', to: 'APPROVED' },
  REJECTED: { from: 'SUBMITTED', to: 'DRAFT' },
  REVISED: { from: 'APPROVED', to: 'DRAFT' },
};

const REFUSALS: Record<ApprovalEventType, string> = {
  SUBMITTED: 'Seul un brouillon peut être soumis.',
  WITHDRAWN: "Seule une version soumise peut être retirée de la validation.",
  APPROVED: 'Seule une version soumise peut être approuvée.',
  REJECTED: 'Seule une version soumise peut être rejetée.',
  REVISED: 'Seule une version approuvée peut être révisée.',
};

function apply(state: ApprovalState, event: ApprovalEvent): ApprovalState {
  const transition = TRANSITIONS[event.type];
  if (state.status !== transition.from) {
    throw new DomainError(REFUSALS[event.type]);
  }
  const revision = event.type === 'REVISED' ? state.revision + 1 : state.revision;
  if (event.revision !== revision) {
    throw new DomainError(`Historique de validation incohérent : version ${event.revision} au lieu de ${revision}.`);
  }
  return { status: transition.to, revision };
}

function cleanComment(comment: string | null): string | null {
  const text = comment?.trim() ?? '';
  if (text.length > MAX_COMMENT) {
    throw new DomainError(`Le commentaire ne peut pas dépasser ${MAX_COMMENT} caractères.`);
  }
  return text ? text : null;
}

/**
 * Validation d'un document d'un projet, reconstituée à partir de son historique :
 * brouillon → soumis → approuvé (ou rejeté, ou retiré : retour au brouillon) ; une version
 * approuvée se révise en ouvrant la suivante. Le valideur n'approuve jamais sa propre soumission.
 */
export class DocumentApproval {
  private readonly state: ApprovalState;

  private constructor(
    readonly projectId: string,
    readonly subject: ApprovalSubject,
    readonly events: readonly ApprovalEvent[],
  ) {
    let state: ApprovalState = { status: 'DRAFT', revision: 1 };
    let previous: Date | null = null;
    for (const event of events) {
      if (Number.isNaN(event.at.getTime()) || (previous && event.at.getTime() < previous.getTime())) {
        throw new DomainError('Historique de validation incohérent : dates dans le désordre.');
      }
      if (!event.by.name.trim()) {
        throw new DomainError("Chaque étape de la validation a un auteur.");
      }
      state = apply(state, event);
      previous = event.at;
    }
    this.state = state;
  }

  static start(projectId: string, subject: ApprovalSubject): DocumentApproval {
    return DocumentApproval.fromEvents(projectId, subject, []);
  }

  static fromEvents(projectId: string, subject: ApprovalSubject, events: readonly ApprovalEvent[]): DocumentApproval {
    assertProjectId(projectId);
    if (!isApprovalSubject(subject)) {
      throw new DomainError(`Document à valider inconnu : "${subject}".`);
    }
    return new DocumentApproval(projectId, subject, events.map((event) => ({ ...event, at: new Date(event.at) })));
  }

  get status(): ApprovalStatus {
    return this.state.status;
  }

  get revision(): number {
    return this.state.revision;
  }

  /** Modifiable seulement en brouillon : une version soumise ou approuvée est figée. */
  get editable(): boolean {
    return this.state.status === 'DRAFT';
  }

  /** Dernière approbation : la version de référence. */
  get lastApproval(): ApprovalEvent | null {
    return [...this.events].reverse().find((event) => event.type === 'APPROVED') ?? null;
  }

  /** Soumission qui a mené à l'état courant (version soumise ou approuvée). */
  get currentSubmission(): ApprovalEvent | null {
    if (this.state.status === 'DRAFT') return null;
    return [...this.events].reverse().find((event) => event.type === 'SUBMITTED') ?? null;
  }

  /** Soumission de la version approuvée la plus récente. */
  get approvedSubmission(): ApprovalEvent | null {
    const approval = this.lastApproval;
    if (!approval) return null;
    const index = this.events.lastIndexOf(approval);
    return (
      this.events
        .slice(0, index)
        .reverse()
        .find((event) => event.type === 'SUBMITTED' && event.revision === approval.revision) ?? null
    );
  }

  submit(by: ApprovalActor, at: Date, comment: string | null): DocumentApproval {
    return this.append({ type: 'SUBMITTED', revision: this.revision, at, by, comment: cleanComment(comment) });
  }

  withdraw(by: ApprovalActor, at: Date, comment: string | null): DocumentApproval {
    return this.append({ type: 'WITHDRAWN', revision: this.revision, at, by, comment: cleanComment(comment) });
  }

  approve(by: ApprovalActor, at: Date, comment: string | null, approverIds: readonly string[]): DocumentApproval {
    this.assertApprover(by, approverIds);
    return this.append({ type: 'APPROVED', revision: this.revision, at, by, comment: cleanComment(comment) });
  }

  reject(by: ApprovalActor, at: Date, comment: string | null, approverIds: readonly string[]): DocumentApproval {
    this.assertApprover(by, approverIds);
    const text = cleanComment(comment);
    if (!text || text.length < MIN_REJECTION_COMMENT) {
      throw new DomainError(
        `Expliquez le rejet en ${MIN_REJECTION_COMMENT} caractères au moins : le chef de projet saura quoi corriger.`,
      );
    }
    return this.append({ type: 'REJECTED', revision: this.revision, at, by, comment: text });
  }

  revise(by: ApprovalActor, at: Date, comment: string | null, changeRequest: string | null = null): DocumentApproval {
    return this.append({
      type: 'REVISED',
      revision: this.revision + 1,
      at,
      by,
      comment: cleanComment(comment),
      changeRequest: changeRequest?.trim() || null,
    });
  }

  private assertApprover(by: ApprovalActor, approverIds: readonly string[]): void {
    if (this.state.status !== 'SUBMITTED') return; // le refus de transition est plus parlant
    if (!by.id || !approverIds.includes(by.id)) {
      throw new DomainError("Seuls les valideurs désignés pour ce projet décident d'une version soumise.");
    }
    if (this.currentSubmission?.by.id === by.id) {
      throw new DomainError("Vous avez soumis cette version : un autre valideur doit la décider.");
    }
  }

  private append(event: ApprovalEvent): DocumentApproval {
    return new DocumentApproval(this.projectId, this.subject, [...this.events, event]);
  }
}
