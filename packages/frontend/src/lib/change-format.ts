import type {
  ChangeAssessmentInput,
  ChangeCategory,
  ChangeDisposition,
  ChangeImpactArea,
  ChangeImpactDirection,
  ChangeLogDto,
  ChangeLogInput,
  ChangeRequestInput,
  ChangeStatus,
  StakeholderImpactRisk,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et conversions du registre des modifications (templates PMI). */

export const CHANGE_CATEGORY_LABELS: Record<ChangeCategory, string> = {
  SCOPE: 'Périmètre',
  QUALITY: 'Qualité',
  REQUIREMENTS: 'Exigences',
  COST: 'Coût',
  SCHEDULE: 'Délai',
  DOCUMENTS: 'Documents',
};

export const CHANGE_CATEGORIES = Object.keys(CHANGE_CATEGORY_LABELS) as ChangeCategory[];

export const IMPACT_AREAS: readonly ChangeImpactArea[] = ['SCOPE', 'QUALITY', 'REQUIREMENTS', 'COST', 'SCHEDULE'];

export const DIRECTION_LABELS: Record<ChangeImpactDirection, string> = {
  INCREASE: 'Augmentation',
  DECREASE: 'Diminution',
  MODIFY: 'Modification',
};

export const STAKEHOLDER_RISK_LABELS: Record<StakeholderImpactRisk, string> = {
  LOW: 'Risque faible',
  MEDIUM: 'Risque moyen',
  HIGH: 'Risque élevé',
};

export const STAKEHOLDER_RISK_MODIFIERS: Record<StakeholderImpactRisk, 'green' | 'amber' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'red',
};

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  SUBMITTED: 'Soumise',
  UNDER_REVIEW: 'En analyse',
  DECIDED: 'Décidée',
  IMPLEMENTED: 'Mise en œuvre',
  CLOSED: 'Close',
};

export const DISPOSITION_LABELS: Record<ChangeDisposition, string> = {
  APPROVED: 'Approuvée',
  DEFERRED: 'Reportée',
  REJECTED: 'Rejetée',
};

export const DISPOSITION_MODIFIERS: Record<ChangeDisposition, 'green' | 'amber' | 'red'> = {
  APPROVED: 'green',
  DEFERRED: 'amber',
  REJECTED: 'red',
};

/** Statuts qui précèdent la décision (miroir de la règle du domaine). */
export const isUndecided = (status: ChangeStatus) => status === 'SUBMITTED' || status === 'UNDER_REVIEW';

/** En attente d'une décision des valideurs : soumise, en analyse, ou reportée (à redécider). */
export const awaitsDecision = (request: { status: ChangeStatus; disposition: ChangeDisposition | null }) =>
  isUndecided(request.status) || (request.status === 'DECIDED' && request.disposition === 'DEFERRED');

/** Choix proposés aux valideurs, dans l'ordre de la décision. */
export const DECISION_CHOICES: readonly { value: ChangeDisposition; label: string }[] = [
  { value: 'APPROVED', label: 'Approuver' },
  { value: 'DEFERRED', label: 'Reporter' },
  { value: 'REJECTED', label: 'Rejeter' },
];

/** Coût en M FCFA signé, ex. « +48 M FCFA ». */
export function formatCostImpact(amount: number): string {
  const millions = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(
    amount / 1_000_000,
  );
  return `${millions} M FCFA`;
}

/** Délai signé en jours ouvrés, ex. « +6 j ». */
export const formatScheduleImpact = (days: number) => `${days > 0 ? '+' : ''}${days} j`;

export function blankChangeRequest(code: string): ChangeRequestInput {
  const none = { direction: null, description: '' };
  return {
    code,
    title: '',
    requestor: '',
    submittedOn: todayIso(),
    categories: [],
    description: '',
    justification: '',
    impacts: { SCOPE: none, QUALITY: none, REQUIREMENTS: none, COST: none, SCHEDULE: none },
    stakeholderRisk: null,
    stakeholderImpact: '',
    costImpact: 0,
    scheduleImpactDays: 0,
    affectedDocuments: '',
    comments: '',
    assessment: null,
    status: 'SUBMITTED',
    disposition: null,
    decidedOn: null,
    decidedBy: '',
    decisionRationale: '',
  };
}

/** Évaluation de départ : rejeter ou mettre en œuvre, à compléter. */
export function blankAssessment(): ChangeAssessmentInput {
  const alternative = (name: string) => ({ name, cost: '', schedule: '', pros: '', cons: '' });
  return {
    assessedById: '',
    assessedOn: todayIso(),
    alternatives: [alternative('A1 · Rejeter'), alternative('A2 · Mettre en œuvre')],
    criteria: [],
    recommended: null,
    recommendation: '',
    implementationNotes: '',
  };
}

export function changeLogDtoToInput(dto: ChangeLogDto): ChangeLogInput {
  return { requests: dto.requests.map(({ assessmentResult: _result, ...request }) => structuredClone(request)) };
}
