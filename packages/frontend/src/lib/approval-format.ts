import type {
  ApprovalAction,
  ApprovalDto,
  ApprovalEventType,
  ApprovalStatus,
  ApprovalSubject,
  PendingApprovalKind,
  ProjectApprovalsDto,
} from '@shared/index';
import { formatLongDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

export const SUBJECT_LABELS: Record<ApprovalSubject, string> = {
  BUSINESS_CASE: 'Business case',
  CHARTER: 'Charte du projet',
  BENEFITS_PLAN: 'Plan de gestion des bénéfices',
  PROJECT_MANAGEMENT_PLAN: 'Plan de management du projet',
  REQUIREMENTS: 'Registre des exigences',
};

/** Ce que couvre la validation de chaque document. */
export const SUBJECT_SCOPES: Record<ApprovalSubject, string> = {
  BUSINESS_CASE: "Décision d'investissement.",
  CHARTER: 'Autorise le projet et nomme le chef de projet.',
  BENEFITS_PLAN: 'Bénéfices attendus, indicateurs et responsables.',
  PROJECT_MANAGEMENT_PLAN:
    'Avec ses plans de gestion et ses références de base : périmètre (énoncé, WBS, dictionnaire), échéancier, coûts et financement.',
  REQUIREMENTS: 'Exigences validées par le métier avant le développement ; leur avancement reste libre.',
};

export const SUBJECT_VIEWS: Record<ApprovalSubject, AppView> = {
  BUSINESS_CASE: 'business-case',
  CHARTER: 'charter',
  BENEFITS_PLAN: 'benefits',
  PROJECT_MANAGEMENT_PLAN: 'project-management-plan',
  REQUIREMENTS: 'requirements',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En validation',
  APPROVED: 'Approuvé',
};

export const APPROVAL_STATUS_MODIFIERS: Record<ApprovalStatus, 'grey' | 'amber' | 'green'> = {
  DRAFT: 'grey',
  SUBMITTED: 'amber',
  APPROVED: 'green',
};

export const APPROVAL_EVENT_LABELS: Record<ApprovalEventType, string> = {
  SUBMITTED: 'Soumis',
  WITHDRAWN: 'Soumission retirée',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  REVISED: 'Révision ouverte',
};

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  SUBMIT: 'Soumettre à validation',
  WITHDRAW: 'Retirer la soumission',
  APPROVE: 'Approuver',
  REJECT: 'Rejeter',
  REVISE: 'Réviser',
};

export const PENDING_KIND_LABELS: Record<PendingApprovalKind, string> = {
  DOCUMENT: 'Document',
  CHANGE_REQUEST: 'Demande de modification',
  SOURCE_SELECTION: 'Achat',
};

/** Rejet : le chef de projet doit savoir quoi corriger. */
export const MIN_REJECTION_COMMENT = 10;

export function subjectOf(approvals: ProjectApprovalsDto | null, subject: ApprovalSubject): ApprovalDto | null {
  return approvals?.subjects.find((item) => item.subject === subject) ?? null;
}

/** Une version soumise ou approuvée est figée. */
export function isLocked(approval: ApprovalDto | null): boolean {
  return approval !== null && approval.status !== 'DRAFT';
}

/** Date d'une étape (date-heure ISO), ex. « 14 février 2025 ». */
export function approvalDate(at: string): string {
  return formatLongDate(at.slice(0, 10));
}
