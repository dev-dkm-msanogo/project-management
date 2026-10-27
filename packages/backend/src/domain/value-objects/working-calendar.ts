import { DomainError } from '@domain/errors/domain-errors';

const MS_PER_DAY = 86_400_000;

const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

/** Jour de la semaine ISO : 1 = lundi … 7 = dimanche. */
const isoWeekday = (date: Date): number => ((date.getUTCDay() + 6) % 7) + 1;

/**
 * Calendrier du projet : jours ouvrés de la semaine et jours fériés. Les jours ouvrés sont
 * numérotés à partir d'une date de début (jour 0 = premier jour ouvré à partir de cette date).
 */
export class WorkingCalendar {
  private constructor(
    private readonly weekdays: ReadonlySet<number>,
    private readonly holidays: ReadonlySet<string>,
  ) {}

  static of(workingWeekdays: readonly number[], holidays: readonly Date[]): WorkingCalendar {
    if (workingWeekdays.length === 0) {
      throw new DomainError('Le calendrier compte au moins un jour ouvré par semaine.');
    }
    return new WorkingCalendar(new Set(workingWeekdays), new Set(holidays.map(dayKey)));
  }

  isWorkingDay(date: Date): boolean {
    return this.weekdays.has(isoWeekday(date)) && !this.holidays.has(dayKey(date));
  }

  /** Les `count` premiers jours ouvrés à partir de `start` (inclus). */
  workingDays(start: Date, count: number): Date[] {
    const days: Date[] = [];
    // Garde-fou : au plus dix ans de recherche, même avec un calendrier très chargé en fériés.
    for (let cursor = new Date(start), guard = 0; days.length < count && guard < 3660; guard += 1) {
      if (this.isWorkingDay(cursor)) days.push(cursor);
      cursor = new Date(cursor.getTime() + MS_PER_DAY);
    }
    if (days.length < count) {
      throw new DomainError('Le calendrier ne laisse pas assez de jours ouvrés pour planifier les activités.');
    }
    return days;
  }
}
