import type { SelectionCriterionInput } from '@shared/index';

/**
 * Analyse multicritère pondérée (sélection des fournisseurs, évaluation des demandes de
 * modification) : notes de 1 à 5, pondérations totalisant 100 %, score sur 500.
 */

export const RATING_MAX = 5;
export const TOTAL_WEIGHT = 100;
export const MAX_SCORE = TOTAL_WEIGHT * RATING_MAX;
export const DEFAULT_RATING = 3;

export const RATING_LABELS: Record<number, string> = {
  1: '1 · Insuffisant',
  2: '2 · Faible',
  3: '3 · Satisfaisant',
  4: '4 · Bon',
  5: '5 · Excellent',
};

export const weightTotal = (criteria: readonly SelectionCriterionInput[]) =>
  criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

/** Totaux pondérés pendant la saisie (le serveur fait foi à l'enregistrement). */
export const draftTotals = (optionCount: number, criteria: readonly SelectionCriterionInput[]) =>
  Array.from({ length: optionCount }, (_, index) =>
    criteria.reduce((sum, criterion) => sum + criterion.weight * (criterion.ratings[index] ?? 0), 0),
  );

/** Une option ajoutée reçoit la note par défaut sur chaque critère. */
export const withOptionAdded = (criteria: readonly SelectionCriterionInput[]) =>
  criteria.map((criterion) => ({ ...criterion, ratings: [...criterion.ratings, DEFAULT_RATING] }));

/** Une option retirée perd sa note sur chaque critère. */
export const withOptionRemoved = (criteria: readonly SelectionCriterionInput[], index: number) =>
  criteria.map((criterion) => ({ ...criterion, ratings: criterion.ratings.filter((_, i) => i !== index) }));
