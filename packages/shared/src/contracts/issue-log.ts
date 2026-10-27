/**
 * Contrats du journal des problèmes (PMBOK 8 : processus 27, alimenté par 30), alignés sur le
 * template « Issue Log ». Dates en ISO-8601.
 */

export type IssueType =
  | 'RESOURCE'
  | 'TECHNICAL'
  | 'STAKEHOLDER'
  | 'SCOPE'
  | 'QUALITY'
  | 'SCHEDULE'
  | 'COST'
  | 'EXTERNAL'
  | 'PROCESS';

export type IssuePriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** Ouvert (consigné) → en cours → escaladé (sponsor, tiers) → résolu. */
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED';

export interface IssueInput {
  /** Identifiant, ex. « I-001 ». */
  code: string;
  type: IssueType;
  description: string;
  priority: IssuePriority;
  /** Effet sur les objectifs du projet (périmètre, délai, coût, qualité…). */
  impact: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  ownerId: string;
  /** Date à laquelle le problème a été consigné. */
  raisedOn: string;
  status: IssueStatus;
  /** Date et description de la résolution : obligatoires une fois résolu, absentes sinon. */
  resolvedOn: string | null;
  /** Résolution retenue ou action en cours. */
  resolution: string;
  comments: string;
  /** Risque du registre qui s'est concrétisé, s'il y en a un. */
  riskCode: string | null;
  /** Demande de modification ouverte pour le traiter, s'il y en a une. */
  changeCode: string | null;
}

export interface IssueLogInput {
  issues: IssueInput[];
}

export interface IssueLogSummaryDto {
  total: number;
  /** Non résolus (ouverts, en cours, escaladés). */
  open: number;
  escalated: number;
  highPriorityOpen: number;
  resolved: number;
  /** Délai moyen de résolution en jours ; absent sans problème résolu. */
  averageResolutionDays: number | null;
}

export interface IssueLogDto extends IssueLogInput {
  projectId: string;
  /** Intitulés des risques et demandes de modification liés, lus dans leurs registres. */
  references: { risks: Record<string, string>; changes: Record<string, string> };
  summary: IssueLogSummaryDto;
}
