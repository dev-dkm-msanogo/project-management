import { DomainError } from '@domain/errors/domain-errors';
import { assertUniqueNames, requiredText, scaleValue } from '@domain/value-objects/register-rules';

/** Les pondérations des critères d'une analyse totalisent 100 %. */
export const TOTAL_WEIGHT = 100;

export interface ScoringCriterion {
  name: string;
  description: string;
  /** Pondération en %. */
  weight: number;
  /** Note de 1 à 5 de chaque option, dans l'ordre des options. */
  ratings: readonly number[];
}

export interface ScoringResult {
  totals: number[];
  leaders: string[];
}

/**
 * Analyse multicritère pondérée (sélection des fournisseurs, évaluation d'une demande de
 * modification) : critères nommés et uniques, pondérations entières totalisant 100 %, une note
 * de 1 à 5 par option. `context` préfixe les messages d'erreur.
 */
export function scoringCriteria(
  criteria: readonly ScoringCriterion[],
  optionCount: number,
  context: string,
): ScoringCriterion[] {
  const list = criteria.map((criterion, index) => {
    const name = requiredText(criterion.name, `${context} : nommez le critère n° ${index + 1}.`);
    if (!Number.isInteger(criterion.weight) || criterion.weight < 1 || criterion.weight > TOTAL_WEIGHT) {
      throw new DomainError(`${context} : la pondération de « ${name} » doit être un entier de 1 à 100 %.`);
    }
    if (criterion.ratings.length !== optionCount) {
      throw new DomainError(`${context} : notez chaque option sur « ${name} ».`);
    }
    return {
      name,
      description: criterion.description.trim(),
      weight: criterion.weight,
      ratings: criterion.ratings.map((rating) => scaleValue(rating, `La note sur « ${name} »`)),
    };
  });
  assertUniqueNames(list.map((criterion) => criterion.name), (name) => `${context} : critère en double, « ${name} ».`);

  const total = list.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (list.length > 0 && total !== TOTAL_WEIGHT) {
    throw new DomainError(`${context} : les pondérations totalisent ${total} % au lieu de 100 %.`);
  }
  return list;
}

/** Score = pondération × note ; total de chaque option (sur 500) et option(s) en tête. */
export function scoringResult(options: readonly string[], criteria: readonly ScoringCriterion[]): ScoringResult {
  const totals = options.map((_, index) =>
    criteria.reduce((sum, criterion) => sum + criterion.weight * criterion.ratings[index]!, 0),
  );
  const best = Math.max(...totals);
  return { totals, leaders: options.filter((_, index) => totals[index] === best) };
}
