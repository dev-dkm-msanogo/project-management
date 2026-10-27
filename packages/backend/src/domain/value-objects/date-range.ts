import { DomainError } from '@domain/errors/domain-errors';

/** Intervalle de dates [from, to] avec from <= to. Immuable (copies défensives). */
export class DateRange {
  private constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) {}

  static of(from: Date, to: Date): DateRange {
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new DomainError('Les bornes de la période doivent être des dates valides.');
    }
    if (to.getTime() < from.getTime()) {
      throw new DomainError('La fin de la période ne peut pas précéder son début.');
    }
    return new DateRange(new Date(from), new Date(to));
  }
}
