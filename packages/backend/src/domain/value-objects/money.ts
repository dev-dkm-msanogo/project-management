import { DomainError } from '@domain/errors/domain-errors';
import { Percentage } from '@domain/value-objects/percentage';

/** Montant monétaire (montant + devise ISO-4217). Immuable. */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static of(amount: number, currency = 'USD'): Money {
    if (!Number.isFinite(amount)) {
      throw new DomainError('Un montant monétaire doit être un nombre fini.');
    }
    if (!/^[A-Za-z]{3}$/.test(currency)) {
      throw new DomainError('La devise doit être un code ISO-4217 à 3 lettres.');
    }
    return new Money(amount, currency.toUpperCase());
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new DomainError(
        `Devises incompatibles : ${this.currency} vs ${other.currency}.`,
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /** Part que représente ce montant dans un total. */
  percentageOf(total: Money): Percentage {
    this.assertSameCurrency(total);
    return Percentage.ratio(this.amount, total.amount);
  }
}
