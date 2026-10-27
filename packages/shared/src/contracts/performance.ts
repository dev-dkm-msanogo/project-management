/**
 * Contrats du pilotage du réel : avancement des tâches, dépenses réelles, valeur acquise et
 * tableau de bord du portefeuille. Dates en chaînes ISO-8601 (YYYY-MM-DD), montants en FCFA entiers.
 */
import type { RagLevel } from './executive-status-report';
import type { ProjectRole, ProjectStatus } from './project';
import type { TaskStatus } from './project-plan';

// --- Avancement des tâches ---

/** Avancement d'une tâche élémentaire, saisi par la personne affectée ou un éditeur. */
export interface TaskProgressInput {
  status: TaskStatus;
  /** 0 à 100. */
  percentComplete: number;
  actualStart: string | null;
  actualFinish: string | null;
  /** Date de la mesure (« situation au »), jamais dans le futur. */
  asOf: string;
  note: string | null;
}

export interface TaskProgressDto extends TaskProgressInput {
  wbs: string;
  updatedBy: string;
  /** Horodatage ISO de la dernière mise à jour. */
  updatedAt: string;
}

/** Tâche affectée à l'utilisateur connecté, tous projets confondus. */
export interface MyTaskDto {
  projectId: string;
  projectName: string;
  wbs: string;
  name: string;
  start: string | null;
  end: string | null;
  status: TaskStatus;
  percentComplete: number;
  progress: TaskProgressDto | null;
  /** Fin prévue dépassée sans être terminée. */
  overdue: boolean;
}

export interface MyTasksDto {
  /** Ressource du référentiel rattachée au compte ; `null` : aucune, donc aucune tâche. */
  resourceName: string | null;
  tasks: MyTaskDto[];
}

// --- Dépenses réelles ---

/** Même nature que les estimations : main-d'œuvre ou coûts physiques (licences, matériel…). */
export type ActualCostNature = 'LABOR' | 'PHYSICAL';

export interface ActualCostInput {
  code: string;
  /** Date de la dépense (facture, service fait), jamais dans le futur. */
  date: string;
  wbsCode: string;
  nature: ActualCostNature;
  description: string;
  supplier: string;
  /** Pièce justificative : facture, bon de commande… */
  reference: string;
  amount: number;
}

export interface ActualCostsInput {
  entries: ActualCostInput[];
}

export interface ActualCostsSummaryDto {
  total: number;
  labor: number;
  physical: number;
  /** Coûts directs estimés ; `null` sans estimations. */
  budget: number | null;
  /** Part du budget consommée, en % (1 décimale). */
  consumedPct: number | null;
}

export interface ActualCostsDto extends ActualCostsInput {
  projectId: string;
  summary: ActualCostsSummaryDto;
  /** Intitulés des éléments de WBS cités, par code. */
  wbsNames: Record<string, string>;
}

// --- Valeur acquise ---

export interface EarnedValueIndicatorsDto {
  /** Valeur planifiée (VP / PV) à la date d'état. */
  pv: number;
  /** Valeur acquise (VA / EV). */
  ev: number;
  /** Coût réel (CR / AC). */
  ac: number;
  /** Écart de délai EV − PV et de coût EV − AC. */
  sv: number;
  cv: number;
  /** Indices de performance ; `null` sans dénominateur. */
  spi: number | null;
  cpi: number | null;
  /** Estimation à l'achèvement BAC / CPI, reste à faire, écart à l'achèvement. */
  eac: number;
  etc: number;
  vac: number;
  /** Performance à tenir sur le reste du budget. */
  tcpi: number | null;
  plannedPct: number;
  earnedPct: number;
  spentPct: number;
}

/** Élément de premier niveau de la WBS (compte de contrôle). */
export interface EarnedValueElementDto {
  wbs: string;
  name: string;
  budget: number;
  pv: number;
  ev: number;
  ac: number;
  spi: number | null;
  cpi: number | null;
}

/** Cumuls mensuels : PV sur toute la référence, AC jusqu'au mois de la date d'état. */
export interface EarnedValuePeriodDto {
  period: string;
  pv: number;
  ac: number | null;
}

export interface EarnedValueDto {
  projectId: string;
  statusDate: string;
  /** Date d'état proposée : dernière mesure d'avancement, sinon aujourd'hui. */
  defaultStatusDate: string;
  /**
   * Référence de base mesurée : la dernière approuvée avec le plan de management (même pendant une
   * révision) ; `null` : jamais approuvée, mesure contre la WBS et les estimations en cours.
   */
  baseline: { revision: number; approvedAt: string } | null;
  /** Budget à l'achèvement : coûts directs des lots de travaux. */
  bac: number;
  /** Réserves hors mesure de performance. */
  contingencyReserve: number;
  managementReserve: number;
  indicators: EarnedValueIndicatorsDto;
  elements: EarnedValueElementDto[];
  periods: EarnedValuePeriodDto[];
  /** Coûts estimés qu'aucun élément de la WBS ne situe (hors mesure). */
  unmappedBudget: number;
}

// --- Portefeuille ---

export interface PortfolioProjectDto {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  /** Droits de l'utilisateur sur ce projet. */
  access: ProjectRole;
  /** Statut global du rapport exécutif ; `null` sans rapport. */
  rag: RagLevel | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  /** Avancement physique en % (pondéré par les budgets, sinon par les durées) ; `null` sans WBS. */
  percentComplete: number | null;
  spi: number | null;
  cpi: number | null;
  bac: number | null;
  ac: number;
  overdueTasks: number;
  openRisks: number;
  criticalRisks: number;
  openIssues: number;
  nextMilestone: { name: string; date: string } | null;
}

export interface PortfolioDto {
  projects: PortfolioProjectDto[];
}
