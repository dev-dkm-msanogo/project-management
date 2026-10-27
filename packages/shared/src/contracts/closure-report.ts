/**
 * Contrats du rapport de clôture (PMBOK 8 : processus 40), alignés sur les templates « Final
 * Report » et « Final Product / Service / Result Transition ». Les écarts et l'état des registres
 * sont relus dans le projet ; une fois approuvé, le rapport clôt le projet. Dates en ISO-8601.
 */

/** Objectif du projet : critères d'achèvement et façon dont ils ont été atteints. */
export interface ClosureObjectiveInput {
  objective: string;
  criteria: string;
  howMet: string;
}

export type BenefitOutcome = 'MET' | 'MEASURING' | 'NOT_MET';

/** Besoin métier du business case ou bénéfice du plan, et sa situation à la clôture. */
export interface ClosureBenefitInput {
  need: string;
  outcome: BenefitOutcome;
  comments: string;
}

/** Destinataire de la transition : ce qu'il exploite désormais et ce qui lui est remis. */
export interface TransitionRecipientInput {
  recipient: string;
  responsibility: string;
  materials: string;
}

/** Acceptation de la transition par un destinataire ; `acceptedOn` absent : pas encore acceptée. */
export interface TransitionAcceptanceInput {
  /** Ressource du référentiel (identifiant). */
  resourceId: string;
  role: string;
  acceptedOn: string | null;
}

export interface ClosureReportInput {
  preparedOn: string;
  description: string;
  objectives: ClosureObjectiveInput[];
  scheduleComments: string;
  costComments: string;
  benefits: ClosureBenefitInput[];
  /** Disposition finale des risques et problèmes encore ouverts (transférés, acceptés, clos). */
  riskAndIssueDisposition: string;
  /** Produit, service ou résultat transféré, et ce qu'il comprend. */
  product: string;
  recipients: TransitionRecipientInput[];
  training: string;
  supportArrangements: string;
  /** Éléments restants ou reportés, un par ligne. */
  outstandingItems: string[];
  acceptances: TransitionAcceptanceInput[];
}

export interface ClosureScheduleFactsDto {
  /** Fin de la référence approuvée (à défaut, de la WBS en cours). */
  baselineFinish: string | null;
  /** Fin réelle (toutes les tâches terminées) ou prévue. */
  finish: string | null;
  finished: boolean;
  /** Écart en jours calendaires, positif en cas de retard. */
  varianceDays: number | null;
  percentComplete: number | null;
}

export interface ClosureCostFactsDto {
  /** Budget à l'achèvement, coût réel, estimation à l'achèvement. */
  bac: number;
  ac: number;
  eac: number;
  /** Coût réel moins budget : positif en cas de dépassement. */
  variance: number;
  contingencyReserve: number;
  managementReserve: number;
  cpi: number | null;
}

/** Ce que le rapport relit dans le projet ; figé avec la version approuvée. */
export interface ClosureFactsDto {
  schedule: ClosureScheduleFactsDto;
  cost: ClosureCostFactsDto | null;
  deliverables: { total: number; accepted: number; rejected: number; pending: number };
  openRisks: { code: string; title: string }[];
  openIssues: { code: string; description: string }[];
  /** Bénéfices du plan de gestion des bénéfices, à reprendre dans le rapport. */
  plannedBenefits: string[];
  lessons: { total: number; transferredOn: string | null };
}

export interface ClosureReportDto extends ClosureReportInput {
  projectId: string;
  facts: ClosureFactsDto;
}
