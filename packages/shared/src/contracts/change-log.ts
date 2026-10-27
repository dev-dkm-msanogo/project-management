/**
 * Contrats du registre des modifications (PMBOK 8 : processus 39), alignés sur les templates
 * « Change Log », « Change Request » et « Change Request Assessment ». Dates en ISO-8601,
 * montants en FCFA.
 */
import type { SelectionCriterionInput, SourceSelectionResultDto } from './procurement';

export type ChangeCategory = 'SCOPE' | 'QUALITY' | 'REQUIREMENTS' | 'COST' | 'SCHEDULE' | 'DOCUMENTS';

/** Domaines dont l'impact est évalué (template « Impacts of Change »). */
export type ChangeImpactArea = 'SCOPE' | 'QUALITY' | 'REQUIREMENTS' | 'COST' | 'SCHEDULE';

export type ChangeImpactDirection = 'INCREASE' | 'DECREASE' | 'MODIFY';

export type StakeholderImpactRisk = 'LOW' | 'MEDIUM' | 'HIGH';

/** Soumise → en analyse → décidée → mise en œuvre → close (plan de gestion des modifications). */
export type ChangeStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'DECIDED' | 'IMPLEMENTED' | 'CLOSED';

export type ChangeDisposition = 'APPROVED' | 'DEFERRED' | 'REJECTED';

export interface ChangeImpactInput {
  /** Absent : sans effet sur ce domaine. */
  direction: ChangeImpactDirection | null;
  description: string;
}

export interface ChangeAlternativeInput {
  name: string;
  cost: string;
  schedule: string;
  pros: string;
  cons: string;
}

/** Évaluation de la demande : alternatives, analyse multicritère pondérée, recommandation. */
export interface ChangeAssessmentInput {
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  assessedById: string;
  assessedOn: string;
  alternatives: ChangeAlternativeInput[];
  /** Notes de 1 à 5 de chaque alternative, dans l'ordre des alternatives ; vide : pas d'analyse. */
  criteria: SelectionCriterionInput[];
  /** Nom de l'alternative recommandée. */
  recommended: string | null;
  recommendation: string;
  implementationNotes: string;
}

export interface ChangeRequestInput {
  /** Identifiant, ex. « CR-001 ». */
  code: string;
  /** Résumé repris dans le registre. */
  title: string;
  requestor: string;
  submittedOn: string;
  categories: ChangeCategory[];
  description: string;
  justification: string;
  impacts: Record<ChangeImpactArea, ChangeImpactInput>;
  stakeholderRisk: StakeholderImpactRisk | null;
  stakeholderImpact: string;
  /** Coût estimé de la modification en FCFA (négatif : économie). */
  costImpact: number;
  /** Effet estimé sur le délai, en jours ouvrés (négatif : gain). */
  scheduleImpactDays: number;
  affectedDocuments: string;
  comments: string;
  assessment: ChangeAssessmentInput | null;
  status: ChangeStatus;
  /**
   * Décision, sa date, son auteur et sa justification : posés par un valideur du projet (comité de
   * contrôle des modifications), jamais saisis dans le registre.
   */
  disposition: ChangeDisposition | null;
  decidedOn: string | null;
  decidedBy: string;
  decisionRationale: string;
}

export interface ChangeLogInput {
  requests: ChangeRequestInput[];
}

/** Décision d'un valideur sur une demande soumise, en analyse ou reportée. */
export interface ChangeDecisionInput {
  disposition: ChangeDisposition;
  rationale: string;
}

export interface ChangeLogSummaryDto {
  total: number;
  /** Soumises ou en analyse : en attente de décision. */
  pending: number;
  approved: number;
  deferred: number;
  rejected: number;
  /** Coût et délai cumulés des modifications approuvées. */
  approvedCost: number;
  approvedScheduleDays: number;
  /** Délai moyen entre soumission et décision, en jours ; absent sans décision. */
  averageDecisionDays: number | null;
  /** Réserve pour aléas des estimations des coûts et part consommée par les modifications approuvées. */
  contingency: { reserve: number; consumed: number; remaining: number } | null;
}

export interface ChangeLogDto {
  projectId: string;
  requests: (ChangeRequestInput & { assessmentResult: SourceSelectionResultDto | null })[];
  summary: ChangeLogSummaryDto;
}
