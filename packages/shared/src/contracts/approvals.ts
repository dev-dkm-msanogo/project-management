/**
 * Circuit de validation : le chef de projet soumet, un valideur désigné pour le projet approuve
 * ou rejette (commentaire obligatoire). Une version approuvée est figée et reste la référence ;
 * « Réviser » ouvre la version suivante en brouillon. Dates-heures en ISO-8601.
 */

/** Documents soumis à validation ; le plan de management est validé avec ses plans et références. */
export type ApprovalSubject = 'BUSINESS_CASE' | 'CHARTER' | 'BENEFITS_PLAN' | 'PROJECT_MANAGEMENT_PLAN' | 'REQUIREMENTS';

export const APPROVAL_SUBJECTS: readonly ApprovalSubject[] = [
  'BUSINESS_CASE',
  'CHARTER',
  'BENEFITS_PLAN',
  'PROJECT_MANAGEMENT_PLAN',
  'REQUIREMENTS',
];

/** Brouillon (modifiable) → soumis (figé, en attente) → approuvé (figé, référence). */
export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export type ApprovalEventType = 'SUBMITTED' | 'WITHDRAWN' | 'APPROVED' | 'REJECTED' | 'REVISED';

export type ApprovalAction = 'SUBMIT' | 'WITHDRAW' | 'APPROVE' | 'REJECT' | 'REVISE';

/** Auteur d'un événement ; `id` absent pour une saisie antérieure au circuit. */
export interface ApprovalActorDto {
  id: string | null;
  name: string;
}

export interface ApprovalEventDto {
  type: ApprovalEventType;
  /** Version concernée (1, 2…). */
  revision: number;
  at: string;
  by: ApprovalActorDto;
  comment: string | null;
  /** Révision : demande de modification approuvée qui la justifie (plan de management). */
  changeRequest?: string | null;
}

export interface ApprovalDto {
  subject: ApprovalSubject;
  status: ApprovalStatus;
  /** Version en cours (brouillon, soumise ou approuvée). */
  revision: number;
  /** Dernière version approuvée : la référence tant que la suivante n'est pas approuvée. */
  approved: { revision: number; at: string; by: ApprovalActorDto; submittedAt: string; archived: boolean } | null;
  /** Soumission de la version en cours, si elle est soumise ou approuvée. */
  submitted: { at: string; by: ApprovalActorDto } | null;
  /** Événements, du plus récent au plus ancien. */
  history: ApprovalEventDto[];
  /** Actions permises à l'utilisateur connecté (le serveur reste seul juge). */
  actions: ApprovalAction[];
  /** Ce qui manque pour soumettre (vide : prêt à être soumis). */
  missingForSubmission: string[];
}

export interface ProjectApproverDto {
  id: string;
  name: string;
  active: boolean;
}

export interface ProjectApprovalsDto {
  projectId: string;
  approvers: ProjectApproverDto[];
  subjects: ApprovalDto[];
}

/** Commentaire facultatif, sauf pour un rejet (10 caractères au moins). */
export interface ApprovalActionInput {
  comment: string | null;
  /** Révision du plan de management : demande de modification approuvée qui la justifie (obligatoire). */
  changeRequest?: string | null;
}

export interface ProjectApproversInput {
  userIds: string[];
}

/** Version approuvée archivée : documents tels qu'ils ont été approuvés, par segment d'API. */
export interface ApprovalSnapshotDto {
  subject: ApprovalSubject;
  revision: number;
  approvedAt: string;
  approvedBy: ApprovalActorDto;
  documents: Record<string, unknown>;
}

export type PendingApprovalKind = 'DOCUMENT' | 'CHANGE_REQUEST' | 'SOURCE_SELECTION';

/** Élément en attente de décision d'un valideur. */
export interface PendingApprovalDto {
  kind: PendingApprovalKind;
  projectId: string;
  projectName: string;
  /** Document concerné (circuit de validation) ; absent pour une demande ou un achat. */
  subject: ApprovalSubject | null;
  /** Code de la demande, achat évalué ou version du document. */
  reference: string;
  title: string;
  submittedAt: string | null;
  submittedBy: string | null;
}
