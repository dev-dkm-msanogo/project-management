/**
 * Contrats du plan de management du projet (PMBOK 8 : processus 21, alimenté par 39), alignés
 * sur le modèle de plan intégré : plans subsidiaires et références de base (lus en direct),
 * cycle de vie, approche de développement, gestion des modifications et de la configuration
 * (rédigés ici). Version, soumission et approbation : circuit de validation. Dates en ISO-8601.
 */
import type { CostSummaryDto } from './cost-estimates';

export type DevelopmentApproachKind = 'PREDICTIVE' | 'ADAPTIVE' | 'HYBRID';

export interface LifeCyclePhaseInput {
  name: string;
  /** Période ou durée, en clair (ex. « févr.–mars 2025 »). */
  period: string;
  description: string;
  /** Revue de passage qui clôt la phase. */
  gate: string;
}

export interface LifeCycleInput {
  overview: string;
  phases: LifeCyclePhaseInput[];
  gateReview: string;
}

export interface DevelopmentApproachInput {
  kind: DevelopmentApproachKind;
  selection: string;
  rationale: string;
  cadence: string;
  definitionOfReady: string;
  definitionOfDone: string;
  tooling: string;
  releaseStrategy: string;
}

export interface ChangeManagementInput {
  approach: string;
  board: string;
  process: string;
  thresholds: string;
  documentation: string;
  tools: string;
}

export interface ConfigurationManagementInput {
  items: string;
  identification: string;
  versionControl: string;
  changeLinkage: string;
  statusAccounting: string;
  audits: string;
  roles: string;
}

export interface ProjectManagementPlanInput {
  preparedOn: string;
  lifeCycle: LifeCycleInput;
  developmentApproach: DevelopmentApproachInput;
  changeManagement: ChangeManagementInput;
  configurationManagement: ConfigurationManagementInput;
}

/** Composants du plan dont l'application connaît l'état (rédigé ou non). */
export type PlanComponentKey =
  | 'SCOPE_MANAGEMENT'
  | 'REQUIREMENTS_MANAGEMENT'
  | 'SCHEDULE_MANAGEMENT'
  | 'FINANCIAL_MANAGEMENT'
  | 'QUALITY_MANAGEMENT'
  | 'RESOURCE_MANAGEMENT'
  | 'COMMUNICATIONS_MANAGEMENT'
  | 'RISK_MANAGEMENT'
  | 'PROCUREMENT_MANAGEMENT'
  | 'STAKEHOLDER_ENGAGEMENT'
  | 'CHANGE_MANAGEMENT'
  | 'CONFIGURATION_MANAGEMENT'
  | 'SCOPE_BASELINE'
  | 'SCHEDULE_BASELINE'
  | 'COST_BASELINE'
  | 'PERFORMANCE_BASELINE'
  | 'LIFE_CYCLE'
  | 'DEVELOPMENT_APPROACH';

/** Ligne de la référence de mesure de la performance : un élément de 1ᵉʳ niveau de la WBS. */
export interface PerformanceBaselineRowDto {
  wbs: string;
  name: string;
  start: string | null;
  finish: string | null;
  durationDays: number | null;
  /** Coûts directs estimés rattachés à cet élément ou à ses descendants. */
  budget: number;
}

export interface PlanBaselinesDto {
  scope: { statementDrafted: boolean; deliverables: number; wbsElements: number; workPackages: number };
  /** Absente tant que l'échéancier n'a aucune tâche datée. */
  schedule: { start: string; finish: string; durationDays: number; tasks: number } | null;
  /** Absente tant que les coûts ne sont pas estimés. */
  cost: CostSummaryDto | null;
  /** Absente sans échéancier daté ni estimation des coûts. */
  performance: {
    rows: PerformanceBaselineRowDto[];
    /** Coûts directs dont le code WBS n'appartient à aucun élément de 1ᵉʳ niveau. */
    unallocated: number;
    contingencyReserve: number;
    /** Total de la référence (BAC) : coûts directs + réserve pour aléas. */
    total: number;
    /** Hors référence : détenue par le sponsor. */
    managementReserve: number;
  } | null;
}

export interface ProjectManagementPlanDto extends ProjectManagementPlanInput {
  projectId: string;
  /** Chef de projet et sponsor, lus dans la charte : ressources du référentiel (identifiants). */
  references: { projectManagerId: string | null; sponsorId: string | null };
  /** État de chaque composant, évalué à chaque lecture. */
  components: Record<PlanComponentKey, boolean>;
  baselines: PlanBaselinesDto;
}
