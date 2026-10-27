import { DomainError } from '@domain/errors/domain-errors';

/** Pourcentage borné [0, 100]. Immuable. */
export class Percentage {
  private constructor(public readonly value: number) {}

  static of(value: number): Percentage {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new DomainError('Un pourcentage doit être un nombre.');
    }
    if (value < 0 || value > 100) {
      throw new DomainError(`Un pourcentage doit être compris entre 0 et 100 (reçu : ${value}).`);
    }
    return new Percentage(value);
  }

  /** Construit un pourcentage à partir d'un ratio partie / tout. */
  static ratio(part: number, whole: number): Percentage {
    if (whole === 0) {
      throw new DomainError('Impossible de calculer un pourcentage avec un tout nul.');
    }
    return Percentage.of((part / whole) * 100);
  }

  get rounded(): number {
    return Math.round(this.value);
  }
}
