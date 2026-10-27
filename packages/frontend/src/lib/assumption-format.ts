import type {
  AssumptionCategory,
  AssumptionEntryInput,
  AssumptionKind,
  AssumptionStatus,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et règles d'affichage du registre des hypothèses et contraintes. */

export const KIND_LABELS: Record<AssumptionKind, string> = {
  ASSUMPTION: 'Hypothèse',
  CONSTRAINT: 'Contrainte',
};

export const ASSUMPTION_CATEGORY_LABELS: Record<AssumptionCategory, string> = {
  SCOPE: 'Périmètre',
  SCHEDULE: 'Délais',
  COST: 'Coûts',
  RESOURCES: 'Ressources',
  STAKEHOLDERS: 'Parties prenantes',
  TECHNICAL: 'Technique',
  QUALITY: 'Qualité',
  ORGANIZATIONAL: 'Organisation',
  EXTERNAL: 'Externe / conformité',
  PROCUREMENT: 'Approvisionnements',
};

export const ASSUMPTION_STATUS_LABELS: Record<AssumptionStatus, string> = {
  TO_VALIDATE: 'À valider',
  VALIDATED: 'Validée',
  INVALIDATED: 'Invalidée',
  ACTIVE: 'En vigueur',
  LIFTED: 'Levée',
};

export const ASSUMPTION_STATUS_MODIFIERS: Record<AssumptionStatus, 'amber' | 'green' | 'red' | 'blue' | 'grey'> = {
  TO_VALIDATE: 'amber',
  VALIDATED: 'green',
  INVALIDATED: 'red',
  ACTIVE: 'blue',
  LIFTED: 'grey',
};

/** Préfixe des codes : H-001 pour une hypothèse, C-001 pour une contrainte. */
export const KIND_PREFIXES: Record<AssumptionKind, string> = { ASSUMPTION: 'H', CONSTRAINT: 'C' };

const ASSUMPTION_STATUSES: readonly AssumptionStatus[] = ['TO_VALIDATE', 'VALIDATED', 'INVALIDATED'];
const CONSTRAINT_STATUSES: readonly AssumptionStatus[] = ['ACTIVE', 'LIFTED'];

// Miroir UX des règles du domaine (assumption-classifications.ts) — le serveur reste l'autorité.
export function statusesFor(kind: AssumptionKind): readonly AssumptionStatus[] {
  return kind === 'ASSUMPTION' ? ASSUMPTION_STATUSES : CONSTRAINT_STATUSES;
}

/** Hypothèse à valider dont l'échéance est dépassée. */
export function isValidationOverdue(
  entry: Pick<AssumptionEntryInput, 'status' | 'dueDate'>,
  today = todayIso(),
): boolean {
  return entry.status === 'TO_VALIDATE' && entry.dueDate !== null && entry.dueDate < today;
}

/** Hypothèse invalidée qu'aucun risque ne porte encore. */
export function needsRisk(entry: Pick<AssumptionEntryInput, 'status' | 'riskCode'>): boolean {
  return entry.status === 'INVALIDATED' && entry.riskCode === null;
}
