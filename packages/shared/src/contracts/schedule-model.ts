/**
 * Contrats du modèle d'ordonnancement (PMBOK 8 : processus 9, alimenté par 33), alignés sur les
 * templates « Activity List », « Activity Attributes », « Duration Estimates », « Duration
 * Estimating Worksheet », « Milestone List », « Project Calendar », « Project Schedule Network
 * Diagram » et « Schedule Baseline ». Dates en ISO-8601, durées en jours ouvrés.
 */

/** Fin-début, début-début, fin-fin, début-fin. */
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface DependencyInput {
  /** Code de l'activité prédécesseur. */
  activity: string;
  type: DependencyType;
  /** Avance (négatif) ou décalage (positif), en jours ouvrés. */
  lagDays: number;
}

export type DurationMethod = 'ANALOGOUS' | 'PARAMETRIC' | 'THREE_POINT';

/** Base de l'estimation de durée (feuille d'estimation), selon la méthode. */
export type DurationBasisInput =
  | { method: 'ANALOGOUS'; reference: string; referenceDays: number; multiplier: number }
  | {
      method: 'PARAMETRIC';
      resourceCount: number;
      hoursPerDay: number;
      /** Disponibilité en %. */
      availability: number;
      performanceFactor: number;
    }
  | { method: 'THREE_POINT'; optimistic: number; mostLikely: number; pessimistic: number };

export type EffortType = 'DISCRETE' | 'APPORTIONED' | 'LEVEL_OF_EFFORT';

export interface ActivityInput {
  /** Identifiant, ex. « A001 ». */
  code: string;
  name: string;
  description: string;
  /** Élément de la WBS de l'échéancier auquel l'activité se rattache. */
  wbsCode: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  ownerId: string;
  effortHours: number;
  /** Durée retenue, en jours ouvrés (0 : jalon). */
  durationDays: number;
  predecessors: DependencyInput[];
  method: DurationMethod;
  basis: DurationBasisInput | null;
  /** Attributs détaillés (template « Activity Attributes »). */
  resources: string;
  skills: string;
  effortType: EffortType;
  location: string;
  constraints: string;
  assumptions: string;
}

export type MilestoneType = 'MAJOR' | 'PHASE_GATE';

export interface ScheduleMilestoneInput {
  /** Identifiant, ex. « M01 ». */
  code: string;
  name: string;
  description: string;
  type: MilestoneType;
  targetDate: string;
  /** Date à laquelle le jalon a été atteint ; `null` : pas encore. */
  achievedOn: string | null;
}

export interface HolidayInput {
  date: string;
  name: string;
}

export interface ProjectCalendarInput {
  /** Jours ouvrés de la semaine, 1 = lundi … 7 = dimanche. */
  workingWeekdays: number[];
  holidays: HolidayInput[];
  notes: string;
}

/** Référence de l'échéancier, approuvée avec le plan de management du projet (circuit de validation). */
export interface ScheduleBaselineInput {
  purpose: string;
  components: string;
}

export interface ScheduleModelInput {
  preparedOn: string;
  /** Date de début du réseau (premier jour ouvré à partir de cette date). */
  projectStart: string;
  activities: ActivityInput[];
  milestones: ScheduleMilestoneInput[];
  calendar: ProjectCalendarInput;
  baseline: ScheduleBaselineInput;
}

/** Résultat de la méthode du chemin critique pour une activité. */
export interface ScheduledActivityDto {
  code: string;
  earlyStart: string;
  earlyFinish: string;
  lateStart: string;
  lateFinish: string;
  /** Marge totale en jours ouvrés. */
  totalFloat: number;
  critical: boolean;
  /** Durée calculée par la base d'estimation (avant arrondi), si elle existe. */
  estimatedDays: number | null;
}

export interface ScheduleNetworkDto {
  start: string;
  finish: string;
  /** Durée du projet en jours ouvrés. */
  workingDays: number;
  activities: ScheduledActivityDto[];
  /** Activités critiques dans l'ordre du réseau. */
  criticalPath: string[];
}

export interface ScheduleModelDto extends ScheduleModelInput {
  projectId: string;
  /** Intitulés des éléments de la WBS liés, lus dans l'échéancier. */
  wbsNames: Record<string, string>;
  network: ScheduleNetworkDto;
}

// --- Dictionnaire de la WBS ---

export interface WorkPackageMilestoneInput {
  name: string;
  dueDate: string;
}

export interface WbsDictionaryEntryInput {
  wbsCode: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  responsibleId: string;
  description: string;
  keyDeliverable: string;
  assumptions: string;
  milestones: WorkPackageMilestoneInput[];
  qualityRequirements: string;
  acceptanceCriteria: string;
  technicalInformation: string;
  agreementInformation: string;
}

export interface WbsDictionaryInput {
  entries: WbsDictionaryEntryInput[];
}

export interface WbsCostLineDto {
  code: string;
  name: string;
  amount: number;
}

export interface WbsDictionaryDto {
  projectId: string;
  entries: (WbsDictionaryEntryInput & {
    /** Intitulé de l'élément dans l'échéancier. */
    name: string;
    /** Effort des activités rattachées (modèle d'ordonnancement) ; absent sans activité. */
    effortHours: number | null;
    /** Estimations des coûts rattachées à l'élément ou à ses descendants. */
    costLines: WbsCostLineDto[];
    costTotal: number;
  })[];
}
