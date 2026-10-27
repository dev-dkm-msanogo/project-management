import { DomainError } from '@domain/errors/domain-errors';

/**
 * Indicateur clé de performance (ex. CPI, SPI, qualité).
 * `displayValue` porte la valeur préformatée pour l'affichage (ex. "1.15", "98%").
 */
export class Kpi {
  private constructor(
    public readonly key: string,
    public readonly label: string,
    public readonly displayValue: string,
    public readonly hint: string | null,
  ) {}

  static create(params: {
    key: string;
    label: string;
    displayValue: string;
    hint?: string | null;
  }): Kpi {
    if (!params.key.trim()) {
      throw new DomainError("La clé du KPI est requise.");
    }
    if (!params.label.trim()) {
      throw new DomainError('Le libellé du KPI est requis.');
    }
    const hint = params.hint?.trim();
    return new Kpi(
      params.key.trim(),
      params.label.trim(),
      params.displayValue.trim(),
      hint ? hint : null,
    );
  }
}
