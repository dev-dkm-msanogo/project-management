import { DomainError } from '@domain/errors/domain-errors';

/** Décision attendue de la direction (approbation, arbitrage, soutien). */
export class Decision {
  private constructor(
    public readonly description: string,
    public readonly impact: string | null,
    public readonly neededBy: Date | null,
  ) {}

  static create(params: {
    description: string;
    impact?: string | null;
    neededBy?: Date | null;
  }): Decision {
    if (!params.description.trim()) {
      throw new DomainError('La description de la décision est requise.');
    }
    const impact = params.impact?.trim();
    return new Decision(
      params.description.trim(),
      impact ? impact : null,
      params.neededBy ?? null,
    );
  }
}
