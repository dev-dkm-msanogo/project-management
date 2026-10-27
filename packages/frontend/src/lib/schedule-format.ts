import type {
  ActivityInput,
  DependencyInput,
  DependencyType,
  DurationBasisInput,
  DurationMethod,
  EffortType,
  MilestoneType,
  ScheduleModelDto,
  ScheduleModelInput,
  WbsDictionaryDto,
  WbsDictionaryEntryInput,
  WbsDictionaryInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés, calculs et conversions du modèle d'ordonnancement et du dictionnaire de la WBS. */

export const DEPENDENCY_LABELS: Record<DependencyType, string> = {
  FS: 'Fin → début',
  SS: 'Début → début',
  FF: 'Fin → fin',
  SF: 'Début → fin',
};

/** Notation courte des relations : FD, DD, FF, DF. */
export const DEPENDENCY_SHORT: Record<DependencyType, string> = { FS: 'FD', SS: 'DD', FF: 'FF', SF: 'DF' };

export const DEPENDENCY_TYPES = Object.keys(DEPENDENCY_LABELS) as DependencyType[];

export const METHOD_LABELS: Record<DurationMethod, string> = {
  ANALOGOUS: 'Analogue',
  PARAMETRIC: 'Paramétrique',
  THREE_POINT: 'Trois points',
};

export const DURATION_METHODS = Object.keys(METHOD_LABELS) as DurationMethod[];

export const EFFORT_TYPE_LABELS: Record<EffortType, string> = {
  DISCRETE: 'Effort distinct',
  APPORTIONED: 'Effort proportionnel',
  LEVEL_OF_EFFORT: 'Effort de soutien',
};

export const EFFORT_TYPES = Object.keys(EFFORT_TYPE_LABELS) as EffortType[];

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  MAJOR: 'Jalon majeur',
  PHASE_GATE: 'Revue de phase',
};

export const MILESTONE_TYPES = Object.keys(MILESTONE_TYPE_LABELS) as MilestoneType[];

export const WEEKDAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

/** « DD+2 », « FF » ; vide pour une relation fin → début sans décalage. */
export function relationLabel(dependency: DependencyInput): string {
  const lag = dependency.lagDays === 0 ? '' : dependency.lagDays > 0 ? `+${dependency.lagDays}` : `${dependency.lagDays}`;
  return dependency.type === 'FS' && !lag ? '' : `${DEPENDENCY_SHORT[dependency.type]}${lag}`;
}

/** « A001 », « A007 DD+2 » : prédécesseur suivi de sa relation. */
export function dependencyLabel(dependency: DependencyInput): string {
  const relation = relationLabel(dependency);
  return relation ? `${dependency.activity} ${relation}` : dependency.activity;
}

/** Durée calculée par la base d'estimation, en jours ouvrés (même règle que le serveur). */
export function estimatedDays(basis: DurationBasisInput, effortHours: number): number | null {
  switch (basis.method) {
    case 'ANALOGOUS':
      return basis.referenceDays * basis.multiplier;
    case 'PARAMETRIC': {
      const daily = basis.resourceCount * basis.hoursPerDay * (basis.availability / 100) * basis.performanceFactor;
      return daily > 0 ? effortHours / daily : null;
    }
    case 'THREE_POINT':
      return (basis.optimistic + 4 * basis.mostLikely + basis.pessimistic) / 6;
  }
}

/** Formule détaillée de la feuille d'estimation. */
export function basisFormula(basis: DurationBasisInput, effortHours: number): string {
  const n = formatDays;
  switch (basis.method) {
    case 'ANALOGOUS':
      return `${n(basis.referenceDays)} j × ${n(basis.multiplier)}`;
    case 'PARAMETRIC':
      return `${n(effortHours)} h ÷ (${n(basis.resourceCount)} × ${n(basis.hoursPerDay)} h × ${n(basis.availability)} % × ${n(basis.performanceFactor)})`;
    case 'THREE_POINT':
      return `(${n(basis.optimistic)} + 4 × ${n(basis.mostLikely)} + ${n(basis.pessimistic)}) ÷ 6`;
  }
}

export function formatDays(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);
}

export function blankBasis(method: DurationMethod): DurationBasisInput {
  switch (method) {
    case 'ANALOGOUS':
      return { method, reference: '', referenceDays: 0, multiplier: 1 };
    case 'PARAMETRIC':
      return { method, resourceCount: 1, hoursPerDay: 8, availability: 100, performanceFactor: 1 };
    case 'THREE_POINT':
      return { method, optimistic: 0, mostLikely: 0, pessimistic: 0 };
  }
}

export function blankActivity(code: string, wbsCode: string): ActivityInput {
  return {
    code,
    name: '',
    description: '',
    wbsCode,
    ownerId: '',
    effortHours: 0,
    durationDays: 1,
    predecessors: [],
    startNoEarlierThan: null,
    method: 'ANALOGOUS',
    basis: null,
    resources: '',
    skills: '',
    effortType: 'DISCRETE',
    location: '',
    constraints: '',
    assumptions: '',
  };
}

export function blankScheduleModel(): ScheduleModelInput {
  return {
    preparedOn: todayIso(),
    projectStart: todayIso(),
    activities: [],
    milestones: [],
    calendar: { workingWeekdays: [1, 2, 3, 4, 5], holidays: [], notes: '' },
    baseline: { purpose: '', components: '' },
  };
}

export function scheduleModelDtoToInput(dto: ScheduleModelDto): ScheduleModelInput {
  const { projectId: _projectId, wbsNames: _wbsNames, network: _network, wbsDates: _wbsDates, ...input } = dto;
  return structuredClone(input);
}

/** Jour de la semaine ISO (1 = lundi … 7 = dimanche) d'une date « AAAA-MM-JJ ». */
export function isoWeekday(iso: string): number {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Date non ouvrée du calendrier du projet (week-end ou jour férié). */
export function isNonWorkingDay(iso: string, calendar: ScheduleModelInput['calendar']): boolean {
  return !calendar.workingWeekdays.includes(isoWeekday(iso)) || calendar.holidays.some((holiday) => holiday.date === iso);
}

// --- Dictionnaire de la WBS ---

export function blankWbsEntry(wbsCode: string): WbsDictionaryEntryInput {
  return {
    wbsCode,
    responsibleId: '',
    description: '',
    keyDeliverable: '',
    assumptions: '',
    milestones: [],
    qualityRequirements: '',
    acceptanceCriteria: '',
    technicalInformation: '',
    agreementInformation: '',
  };
}

export function wbsDictionaryDtoToInput(dto: WbsDictionaryDto): WbsDictionaryInput {
  return {
    entries: dto.entries.map(({ name: _name, effortHours: _effort, costLines: _lines, costTotal: _total, ...entry }) =>
      structuredClone(entry),
    ),
  };
}

export const WBS_ENTRY_SECTIONS = {
  assumptions: 'Hypothèses et contraintes',
  qualityRequirements: 'Exigences de qualité',
  acceptanceCriteria: "Critères d'acceptation",
  technicalInformation: 'Informations techniques',
  agreementInformation: 'Contrats et accords',
} as const satisfies Partial<Record<keyof WbsDictionaryEntryInput, string>>;
