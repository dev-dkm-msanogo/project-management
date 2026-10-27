import type { ScheduleModelInput } from '@shared/index';
import { isNonWorkingDay } from '@/lib/schedule-format';

/** Calculs de dates du Gantt, sur des dates « AAAA-MM-JJ » (UTC, sans décalage de fuseau). */

const MS_PER_DAY = 86_400_000;

const toTime = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

export const addDays = (iso: string, days: number): string =>
  new Date(toTime(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);

/** Jours calendaires de `from` à `to` (négatif si `to` précède `from`). */
export const dayDiff = (from: string, to: string): number => Math.round((toTime(to) - toTime(from)) / MS_PER_DAY);

/** Jours ouvrés de `start` à `end` inclus (durée d'une activité qui finit le jour `end`). */
export function workingDaysBetween(start: string, end: string, calendar: ScheduleModelInput['calendar']): number {
  let count = 0;
  for (let day = start; day <= end; day = addDays(day, 1)) if (!isNonWorkingDay(day, calendar)) count += 1;
  return count;
}

export const minIso = (dates: readonly string[]): string => dates.reduce((a, b) => (b < a ? b : a));
export const maxIso = (dates: readonly string[]): string => dates.reduce((a, b) => (b > a ? b : a));
