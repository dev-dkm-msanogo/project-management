/**
 * Contrat d'ÉCRITURE du rapport exécutif (modèle de saisie).
 *
 * Le rapport est alimenté par les éléments du projet : jalons, périmètre, délai, coût, risques,
 * changements, décisions issues des registres et indicateurs sont calculés à la date du rapport.
 * Ne restent saisis que le jugement et le récit du chef de projet : période, énoncé du statut
 * (et l'ajustement justifié du niveau calculé), résumé, priorités, confiance, et les décisions ou
 * indicateurs qu'aucun registre ne porte.
 */
import type { PriorityDto, RagLevel } from './executive-status-report';

/** Statut global : énoncé du chef de projet ; le niveau est calculé, ajustable avec une justification. */
export interface OverallStatusInput {
  statement: string;
  /** Niveau retenu à la place du niveau calculé ; `null` : le niveau calculé fait foi. */
  ragOverride: RagLevel | null;
  /** Justification de l'ajustement, obligatoire avec lui (affichée dans le rapport). */
  overrideReason: string | null;
}

export interface ExecutiveSummaryInput {
  narrative: string;
}

/** Décision attendue qu'aucun registre ne porte (les demandes et problèmes escaladés sont repris d'office). */
export interface DecisionInput {
  description: string;
  impact: string | null;
  neededBy: string | null;
}

/** Indicateur propre au projet, en plus des indicateurs calculés. */
export interface KpiInput {
  key: string;
  label: string;
  value: string;
  hint: string | null;
}

/** Prévision : la date est calculée ; la confiance et son explication sont celles du chef de projet. */
export interface ForecastInput {
  confidencePercentage: number;
  statement: string;
}

export interface ExecutiveStatusReportInput {
  reportDate: string;
  reportingPeriod: { from: string; to: string };
  overall: OverallStatusInput;
  executiveSummary: ExecutiveSummaryInput;
  decisions: DecisionInput[];
  priorities: PriorityDto[];
  kpis: KpiInput[];
  forecast: ForecastInput;
}
