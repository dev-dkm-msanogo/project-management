/**
 * Contrats du registre des livrables (PMBOK 8 : processus 27, alimenté par 32). Les livrables sont
 * les éléments de la WBS dont la fiche du dictionnaire désigne un livrable clé ; le registre consigne
 * leur vérification (contrôle qualité) puis la décision d'acceptation. Dates en ISO-8601.
 */
import type { TaskStatus } from './project-plan';

/** Vérification : le livrable est conforme à ses exigences qualité. */
export interface DeliverableVerificationInput {
  verifiedOn: string;
  /** Ressource du référentiel (identifiant). */
  verifiedById: string;
  /** Contrôles réalisés et résultat. */
  notes: string;
}

export type AcceptanceDecision = 'ACCEPTED' | 'REJECTED';

/** Acceptation formelle par le sponsor ou le client, sur un livrable vérifié. */
export interface DeliverableAcceptanceInput {
  decision: AcceptanceDecision;
  decidedOn: string;
  /** Ressource du référentiel (identifiant). */
  decidedById: string;
  /** Réserves, ou motif du refus (obligatoire en cas de refus). */
  comments: string;
  /** Demande de modification ouverte à la suite d'un refus. */
  changeCode: string | null;
}

export interface DeliverableRecordInput {
  /** Élément de la WBS qui porte le livrable. */
  wbsCode: string;
  verification: DeliverableVerificationInput | null;
  acceptance: DeliverableAcceptanceInput | null;
}

export interface DeliverablesInput {
  records: DeliverableRecordInput[];
}

/** Étape du livrable : production (avancement de la WBS), vérification, puis décision. */
export type DeliverableStage = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'ACCEPTED' | 'REJECTED';

export interface DeliverableDto extends DeliverableRecordInput {
  /** Intitulé de l'élément de la WBS. */
  name: string;
  /** Livrable clé, critères d'acceptation et responsable, tirés du dictionnaire de la WBS. */
  deliverable: string;
  acceptanceCriteria: string;
  responsibleId: string | null;
  plannedFinish: string | null;
  status: TaskStatus;
  percentComplete: number;
  stage: DeliverableStage;
}

export interface DeliverablesSummaryDto {
  total: number;
  /** Prévus ou en cours de production. */
  inProduction: number;
  /** Achevés, à vérifier. */
  toVerify: number;
  /** Vérifiés, en attente de la décision d'acceptation. */
  awaitingAcceptance: number;
  accepted: number;
  rejected: number;
}

export interface DeliverablesDto {
  projectId: string;
  deliverables: DeliverableDto[];
  summary: DeliverablesSummaryDto;
}
