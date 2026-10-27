import { DomainError } from '@domain/errors/domain-errors';
import type { WorkingCalendar } from '@domain/value-objects/working-calendar';

export const DEPENDENCY_TYPES = ['FS', 'SS', 'FF', 'SF'] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export interface NetworkDependency {
  activity: string;
  type: DependencyType;
  lagDays: number;
}

export interface NetworkActivity {
  code: string;
  durationDays: number;
  predecessors: readonly NetworkDependency[];
  /** Contrainte « début au plus tôt le » : l'activité ne commence pas avant ce jour. */
  startNoEarlierThan?: Date | null;
}

export interface ScheduledActivity {
  code: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloat: number;
  critical: boolean;
}

export interface ScheduleNetwork {
  start: Date;
  finish: Date;
  workingDays: number;
  activities: ScheduledActivity[];
  criticalPath: string[];
}

/** Ordre topologique (Kahn) ; une boucle de dépendances est une erreur. */
function topologicalOrder(activities: readonly NetworkActivity[]): NetworkActivity[] {
  const byCode = new Map(activities.map((activity) => [activity.code, activity]));
  const remaining = new Map(activities.map((activity) => [activity.code, activity.predecessors.length]));
  const successors = new Map<string, string[]>(activities.map((activity) => [activity.code, []]));
  for (const activity of activities) {
    for (const dependency of activity.predecessors) successors.get(dependency.activity)!.push(activity.code);
  }

  const ready = activities.filter((activity) => activity.predecessors.length === 0).map((activity) => activity.code);
  const order: NetworkActivity[] = [];
  while (ready.length > 0) {
    const code = ready.shift()!;
    order.push(byCode.get(code)!);
    for (const successor of successors.get(code)!) {
      const left = remaining.get(successor)! - 1;
      remaining.set(successor, left);
      if (left === 0) ready.push(successor);
    }
  }
  if (order.length < activities.length) {
    const blocked = new Set(activities.filter((activity) => remaining.get(activity.code)! > 0).map((activity) => activity.code));
    throw new DomainError(`Boucle de dépendances entre les activités : ${[...inLoop(blocked, successors)].join(', ')}.`);
  }
  return order;
}

/** Retire des activités bloquées celles qui ne font que suivre la boucle (sans successeur bloqué). */
function inLoop(blocked: Set<string>, successors: Map<string, string[]>): Set<string> {
  let pruned = true;
  while (pruned) {
    pruned = false;
    for (const code of blocked) {
      if (!successors.get(code)!.some((successor) => blocked.has(successor))) {
        blocked.delete(code);
        pruned = true;
      }
    }
  }
  return blocked;
}

/**
 * Méthode du chemin critique, en jours ouvrés du calendrier du projet. Passe avant (dates au plus
 * tôt), passe arrière (dates au plus tard), marge totale ; une activité sans marge est critique.
 * Relations fin-début, début-début, fin-fin et début-fin, avec avance ou décalage ; une contrainte
 * « début au plus tôt le » retarde l'activité jusqu'à ce jour.
 */
export function computeNetwork(
  activities: readonly NetworkActivity[],
  calendar: WorkingCalendar,
  projectStart: Date,
): ScheduleNetwork {
  const order = topologicalOrder(activities);
  const duration = new Map(activities.map((activity) => [activity.code, activity.durationDays]));

  // Passe avant : début au plus tôt (indice de jour ouvré), fin exclusive = début + durée.
  const es = new Map<string, number>();
  for (const activity of order) {
    const d = activity.durationDays;
    let start = activity.startNoEarlierThan ? calendar.indexFrom(projectStart, activity.startNoEarlierThan) : 0;
    for (const { activity: pred, type, lagDays } of activity.predecessors) {
      const predStart = es.get(pred)!;
      const predFinish = predStart + duration.get(pred)!;
      const bound = { FS: predFinish + lagDays, SS: predStart + lagDays, FF: predFinish + lagDays - d, SF: predStart + lagDays - d }[type];
      start = Math.max(start, bound);
    }
    es.set(activity.code, start);
  }
  const projectEnd = Math.max(0, ...activities.map((activity) => es.get(activity.code)! + activity.durationDays));

  // Passe arrière : fin au plus tard (exclusive), bornée par chaque successeur.
  const lf = new Map(activities.map((activity) => [activity.code, projectEnd]));
  for (const activity of [...order].reverse()) {
    const lateFinish = lf.get(activity.code)!;
    const lateStart = lateFinish - activity.durationDays;
    for (const { activity: pred, type, lagDays } of activity.predecessors) {
      const dp = duration.get(pred)!;
      const bound = { FS: lateStart - lagDays, SS: lateStart - lagDays + dp, FF: lateFinish - lagDays, SF: lateFinish - lagDays + dp }[type];
      lf.set(pred, Math.min(lf.get(pred)!, bound));
    }
  }

  const days = calendar.workingDays(projectStart, Math.max(projectEnd, 1));
  const dateAt = (index: number) => days[Math.max(0, Math.min(index, days.length - 1))]!;
  // Une activité de durée nulle (jalon) commence et finit le même jour.
  const finishDate = (start: number, d: number) => dateAt(d > 0 ? start + d - 1 : start);

  const scheduled = order.map((activity) => {
    const earlyStart = es.get(activity.code)!;
    const lateFinish = lf.get(activity.code)!;
    const lateStart = lateFinish - activity.durationDays;
    const totalFloat = lateStart - earlyStart;
    return {
      code: activity.code,
      earlyStart: dateAt(earlyStart),
      earlyFinish: finishDate(earlyStart, activity.durationDays),
      lateStart: dateAt(lateStart),
      lateFinish: finishDate(lateStart, activity.durationDays),
      totalFloat,
      critical: totalFloat <= 0,
      startIndex: earlyStart,
    };
  });

  return {
    start: dateAt(0),
    finish: dateAt(projectEnd - 1),
    workingDays: projectEnd,
    activities: scheduled.map(({ startIndex: _index, ...activity }) => activity),
    criticalPath: scheduled
      .filter((activity) => activity.critical)
      .sort((a, b) => a.startIndex - b.startIndex || a.code.localeCompare(b.code))
      .map((activity) => activity.code),
  };
}
