/**
 * Classifications métier simples (ensembles fermés de valeurs).
 * Modélisées en unions littérales : légères, sérialisables, sans dépendance.
 */

export const TREND_DIRECTIONS = ['UP', 'DOWN', 'STABLE'] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const MILESTONE_STATES = [
  'COMPLETE',
  'IN_PROGRESS',
  'NOT_STARTED',
  'AT_RISK',
] as const;
export type MilestoneState = (typeof MILESTONE_STATES)[number];

export function isTrendDirection(value: string): value is TrendDirection {
  return (TREND_DIRECTIONS as readonly string[]).includes(value);
}

export function isMilestoneState(value: string): value is MilestoneState {
  return (MILESTONE_STATES as readonly string[]).includes(value);
}
