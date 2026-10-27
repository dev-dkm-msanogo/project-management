import {
  computeNetwork,
  DEPENDENCY_TYPES,
  type NetworkDependency,
  type ScheduleNetwork,
} from '@domain/entities/schedule-network';
import { DomainError } from '@domain/errors/domain-errors';
import {
  assertProjectId,
  assertUniqueCodes,
  entryCode,
  requiredText,
} from '@domain/value-objects/register-rules';
import { WbsCode } from '@domain/value-objects/wbs-code';
import { WorkingCalendar } from '@domain/value-objects/working-calendar';

export const DURATION_METHODS = ['ANALOGOUS', 'PARAMETRIC', 'THREE_POINT'] as const;
export type DurationMethod = (typeof DURATION_METHODS)[number];

export const EFFORT_TYPES = ['DISCRETE', 'APPORTIONED', 'LEVEL_OF_EFFORT'] as const;
export type EffortType = (typeof EFFORT_TYPES)[number];

export const MILESTONE_TYPES = ['MAJOR', 'PHASE_GATE'] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

export type DurationBasis =
  | { method: 'ANALOGOUS'; reference: string; referenceDays: number; multiplier: number }
  | { method: 'PARAMETRIC'; resourceCount: number; hoursPerDay: number; availability: number; performanceFactor: number }
  | { method: 'THREE_POINT'; optimistic: number; mostLikely: number; pessimistic: number };

export interface Activity {
  code: string;
  name: string;
  description: string;
  wbsCode: string;
  /** Ressource du référentiel (identifiant). */
  ownerId: string;
  effortHours: number;
  durationDays: number;
  predecessors: readonly NetworkDependency[];
  method: DurationMethod;
  basis: DurationBasis | null;
  resources: string;
  skills: string;
  effortType: EffortType;
  location: string;
  constraints: string;
  assumptions: string;
}

export interface ScheduleMilestone {
  code: string;
  name: string;
  description: string;
  type: MilestoneType;
  targetDate: Date;
  achievedOn: Date | null;
}

export interface ProjectCalendar {
  workingWeekdays: readonly number[];
  holidays: readonly { date: Date; name: string }[];
  notes: string;
}

/** Référence de l'échéancier : approuvée avec le plan de management (circuit de validation). */
export interface ScheduleBaseline {
  purpose: string;
  components: string;
}

export interface ScheduleModelProps {
  projectId: string;
  preparedOn: Date;
  projectStart: Date;
  activities: readonly Activity[];
  milestones: readonly ScheduleMilestone[];
  calendar: ProjectCalendar;
  baseline: ScheduleBaseline;
}

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  (values as readonly string[]).includes(value);

const validDate = (date: Date | null): date is Date => date !== null && !Number.isNaN(date.getTime());

const positive = (value: number) => Number.isFinite(value) && value > 0;

/** Durée calculée par la base d'estimation (feuille d'estimation des durées), en jours ouvrés. */
export function estimatedDays(basis: DurationBasis, effortHours: number): number {
  switch (basis.method) {
    case 'ANALOGOUS':
      return basis.referenceDays * basis.multiplier;
    case 'PARAMETRIC':
      return effortHours / (basis.resourceCount * basis.hoursPerDay * (basis.availability / 100) * basis.performanceFactor);
    case 'THREE_POINT':
      return (basis.optimistic + 4 * basis.mostLikely + basis.pessimistic) / 6;
  }
}

function assertBasis(code: string, method: DurationMethod, basis: DurationBasis): void {
  if (basis.method !== method) {
    throw new DomainError(`${code} : la base d'estimation ne correspond pas à la méthode retenue.`);
  }
  const valid =
    basis.method === 'ANALOGOUS'
      ? positive(basis.referenceDays) && positive(basis.multiplier)
      : basis.method === 'PARAMETRIC'
        ? positive(basis.resourceCount) &&
          positive(basis.hoursPerDay) &&
          basis.hoursPerDay <= 24 &&
          positive(basis.availability) &&
          basis.availability <= 100 &&
          positive(basis.performanceFactor)
        : basis.optimistic >= 0 && basis.optimistic <= basis.mostLikely && basis.mostLikely <= basis.pessimistic && basis.pessimistic > 0;
  if (!valid) {
    const rule = {
      ANALOGOUS: 'durée de référence et coefficient positifs',
      PARAMETRIC: 'ressources, heures par jour (24 au plus), disponibilité (100 % au plus) et facteur de performance positifs',
      THREE_POINT: 'optimiste ≤ probable ≤ pessimiste',
    }[basis.method];
    throw new DomainError(`${code} : base d'estimation invalide (${rule}).`);
  }
}

function activityOf(params: Activity): Activity {
  const code = entryCode(params.code, "d'activité");
  if (!isOneOf(DURATION_METHODS, params.method) || !isOneOf(EFFORT_TYPES, params.effortType)) {
    throw new DomainError(`${code} : méthode d'estimation ou type d'effort inconnu.`);
  }
  if (!Number.isFinite(params.effortHours) || params.effortHours < 0) {
    throw new DomainError(`${code} : l'effort est un nombre d'heures positif ou nul.`);
  }
  if (!Number.isInteger(params.durationDays) || params.durationDays < 0) {
    throw new DomainError(`${code} : la durée est un nombre entier de jours ouvrés.`);
  }
  if (params.basis) assertBasis(code, params.method, params.basis);
  return {
    code,
    name: requiredText(params.name, `${code} : nommez l'activité.`),
    description: params.description.trim(),
    wbsCode: WbsCode.of(params.wbsCode).value,
    ownerId: requiredText(params.ownerId, `${code} : choisissez le responsable dans le référentiel des ressources.`),
    effortHours: params.effortHours,
    durationDays: params.durationDays,
    predecessors: params.predecessors.map((dependency) => ({ ...dependency, activity: dependency.activity.trim() })),
    method: params.method,
    basis: params.basis ? { ...params.basis } : null,
    resources: params.resources.trim(),
    skills: params.skills.trim(),
    effortType: params.effortType,
    location: params.location.trim(),
    constraints: params.constraints.trim(),
    assumptions: params.assumptions.trim(),
  };
}

/** Prédécesseurs connus, sans doublon ni auto-dépendance ; codes normalisés à leur orthographe. */
function linkDependencies(activities: Activity[]): Activity[] {
  const known = new Map(activities.map((activity) => [activity.code.toUpperCase(), activity.code]));
  return activities.map((activity) => {
    const seen = new Set<string>();
    const predecessors = activity.predecessors.map((dependency) => {
      const code = known.get(dependency.activity.toUpperCase());
      if (!code) throw new DomainError(`${activity.code} : prédécesseur inconnu « ${dependency.activity} ».`);
      if (code === activity.code) throw new DomainError(`${activity.code} ne peut dépendre d'elle-même.`);
      if (seen.has(code)) throw new DomainError(`${activity.code} : prédécesseur ${code} cité deux fois.`);
      seen.add(code);
      if (!isOneOf(DEPENDENCY_TYPES, dependency.type)) {
        throw new DomainError(`${activity.code} : type de relation inconnu avec ${code}.`);
      }
      if (!Number.isInteger(dependency.lagDays) || Math.abs(dependency.lagDays) > 365) {
        throw new DomainError(`${activity.code} : l'avance ou le décalage avec ${code} est un nombre entier de jours.`);
      }
      return { activity: code, type: dependency.type, lagDays: dependency.lagDays };
    });
    return { ...activity, predecessors };
  });
}

/**
 * Agrégat racine : le modèle d'ordonnancement du projet. Activités rattachées à la WBS, durées
 * et leur base d'estimation, dépendances sans boucle ; jalons ; calendrier ; référence approuvée
 * par le chef de projet puis par le sponsor. Le réseau (chemin critique) en est calculé.
 */
export class ScheduleModel {
  private constructor(
    readonly props: Readonly<ScheduleModelProps>,
    readonly network: ScheduleNetwork,
  ) {}

  static create(params: ScheduleModelProps): ScheduleModel {
    assertProjectId(params.projectId);
    if (!validDate(params.preparedOn) || !validDate(params.projectStart)) {
      throw new DomainError("Dates de préparation et de début du modèle d'ordonnancement requises.");
    }

    assertUniqueCodes(params.activities, "d'activité");
    const activities = linkDependencies(params.activities.map(activityOf));

    assertUniqueCodes(params.milestones, 'de jalon');
    const milestones = params.milestones.map((milestone) => {
      const code = entryCode(milestone.code, 'de jalon');
      if (!isOneOf(MILESTONE_TYPES, milestone.type) || !validDate(milestone.targetDate)) {
        throw new DomainError(`${code} : type ou date cible invalide.`);
      }
      if (milestone.achievedOn && !validDate(milestone.achievedOn)) {
        throw new DomainError(`${code} : date d'atteinte invalide.`);
      }
      return {
        code,
        name: requiredText(milestone.name, `${code} : nommez le jalon.`),
        description: milestone.description.trim(),
        type: milestone.type,
        targetDate: new Date(milestone.targetDate),
        achievedOn: milestone.achievedOn ? new Date(milestone.achievedOn) : null,
      };
    });

    const weekdays = [...new Set(params.calendar.workingWeekdays)].sort();
    if (weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
      throw new DomainError('Jours ouvrés invalides : de 1 (lundi) à 7 (dimanche).');
    }
    const holidayDays = new Set<string>();
    const holidays = params.calendar.holidays
      .map((holiday) => {
        if (!validDate(holiday.date)) throw new DomainError('Date de jour férié invalide.');
        const key = holiday.date.toISOString().slice(0, 10);
        if (holidayDays.has(key)) throw new DomainError(`Jour férié en double : ${key}.`);
        holidayDays.add(key);
        return { date: new Date(holiday.date), name: requiredText(holiday.name, `Nommez le jour férié du ${key}.`) };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const calendar = WorkingCalendar.of(weekdays, holidays.map((holiday) => holiday.date));

    const props: ScheduleModelProps = Object.freeze({
      projectId: params.projectId,
      preparedOn: new Date(params.preparedOn),
      projectStart: new Date(params.projectStart),
      activities,
      milestones,
      calendar: { workingWeekdays: weekdays, holidays, notes: params.calendar.notes.trim() },
      baseline: {
        purpose: params.baseline.purpose.trim(),
        components: params.baseline.components.trim(),
      },
    });
    // Le réseau est calculé à la création : une boucle de dépendances est refusée.
    return new ScheduleModel(props, computeNetwork(activities, calendar, props.projectStart));
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
