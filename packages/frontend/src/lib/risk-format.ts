import type {
  RiskCategory,
  RiskEntryInput,
  RiskLevel,
  RiskStatus,
  RiskStrategy,
  RiskType,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et règles d'affichage du registre des risques. */

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  THREAT: 'Menace',
  OPPORTUNITY: 'Opportunité',
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  TECHNICAL: 'Technique',
  MANAGEMENT: 'Gestion de projet',
  ORGANIZATIONAL: 'Organisationnel',
  EXTERNAL: 'Externe',
};

export const RISK_STRATEGY_LABELS: Record<RiskStrategy, string> = {
  ESCALATE: 'Escalader',
  AVOID: 'Éviter',
  TRANSFER: 'Transférer',
  MITIGATE: 'Atténuer',
  ACCEPT: 'Accepter',
  EXPLOIT: 'Exploiter',
  SHARE: 'Partager',
  ENHANCE: 'Améliorer',
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  IDENTIFIED: 'Identifié',
  ANALYZED: 'Analysé',
  RESPONSE_PLANNED: 'Réponse planifiée',
  RESPONSE_IN_PROGRESS: 'Réponse en cours',
  CLOSED: 'Clos',
};

/** Modificateurs des badges de statut (styles partagés `status-badge--*`). */
export const RISK_STATUS_MODIFIERS: Record<RiskStatus, 'grey' | 'amber' | 'blue' | 'green'> = {
  IDENTIFIED: 'grey',
  ANALYZED: 'amber',
  RESPONSE_PLANNED: 'blue',
  RESPONSE_IN_PROGRESS: 'blue',
  CLOSED: 'green',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

/** Échelles 1–5 du plan de gestion des risques (processus 16). */
export const PROBABILITY_SCALE: readonly string[] = ['Très faible', 'Faible', 'Moyenne', 'Élevée', 'Très élevée'];
export const IMPACT_SCALE: readonly string[] = ['Négligeable', 'Mineur', 'Modéré', 'Majeur', 'Critique'];

const THREAT_STRATEGIES: readonly RiskStrategy[] = ['ESCALATE', 'AVOID', 'TRANSFER', 'MITIGATE', 'ACCEPT'];
const OPPORTUNITY_STRATEGIES: readonly RiskStrategy[] = ['ESCALATE', 'EXPLOIT', 'SHARE', 'ENHANCE', 'ACCEPT'];

// Miroir UX des règles du domaine (risk-classifications.ts) — le serveur reste l'autorité.
export function strategiesFor(type: RiskType): readonly RiskStrategy[] {
  return type === 'THREAT' ? THREAT_STRATEGIES : OPPORTUNITY_STRATEGIES;
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 20) return 'CRITICAL';
  if (score >= 10) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

/** Réponse en retard : échéance dépassée sur un risque non clos (suivi, processus 38). */
export function isOverdue(risk: Pick<RiskEntryInput, 'status' | 'dueDate'>, today = todayIso()): boolean {
  return risk.status !== 'CLOSED' && risk.dueDate !== null && risk.dueDate < today;
}
