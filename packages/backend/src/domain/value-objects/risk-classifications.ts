/**
 * Classifications du registre des risques (PMBOK) et règle de criticité.
 * Échelles 1–5 et seuils de criticité : référentiel du plan de gestion des risques.
 */

export const RISK_TYPES = ['THREAT', 'OPPORTUNITY'] as const;
export type RiskType = (typeof RISK_TYPES)[number];

export const RISK_CATEGORIES = ['TECHNICAL', 'MANAGEMENT', 'ORGANIZATIONAL', 'EXTERNAL'] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

/** Stratégies de réponse aux menaces. */
export const THREAT_STRATEGIES = ['ESCALATE', 'AVOID', 'TRANSFER', 'MITIGATE', 'ACCEPT'] as const;
/** Stratégies de réponse aux opportunités. */
export const OPPORTUNITY_STRATEGIES = ['ESCALATE', 'EXPLOIT', 'SHARE', 'ENHANCE', 'ACCEPT'] as const;

export type RiskStrategy =
  | (typeof THREAT_STRATEGIES)[number]
  | (typeof OPPORTUNITY_STRATEGIES)[number];

export const RISK_STATUSES = [
  'IDENTIFIED',
  'ANALYZED',
  'RESPONSE_PLANNED',
  'RESPONSE_IN_PROGRESS',
  'CLOSED',
] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const RISK_SCALE_MIN = 1;
export const RISK_SCALE_MAX = 5;

export function strategiesFor(type: RiskType): readonly RiskStrategy[] {
  return type === 'THREAT' ? THREAT_STRATEGIES : OPPORTUNITY_STRATEGIES;
}

/** Criticité d'un score P × I (1–25) : Faible ≤ 4, Moyen ≤ 9, Élevé ≤ 16, Critique ≥ 20. */
export function riskLevel(score: number): RiskLevel {
  if (score >= 20) return 'CRITICAL';
  if (score >= 10) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

export function isRiskType(value: string): value is RiskType {
  return (RISK_TYPES as readonly string[]).includes(value);
}

export function isRiskCategory(value: string): value is RiskCategory {
  return (RISK_CATEGORIES as readonly string[]).includes(value);
}

export function isRiskStatus(value: string): value is RiskStatus {
  return (RISK_STATUSES as readonly string[]).includes(value);
}
