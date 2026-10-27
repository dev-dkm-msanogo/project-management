import type {
  BasisNarrativeInput,
  CostActivityInput,
  CostBasisInput,
  CostEstimateMethod,
  CostEstimatesDto,
  CostEstimatesInput,
  EstimateConfidence,
} from '@shared/index';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';

/** Libellés, calculs d'affichage et conversions des estimations des coûts (templates PMI). */

export const METHOD_LABELS: Record<CostEstimateMethod, string> = {
  ANALOGOUS: 'Analogue',
  PARAMETRIC: 'Paramétrique',
  THREE_POINT: 'Trois points (PERT)',
  BOTTOM_UP: 'Ascendante',
};

export const CONFIDENCE_LABELS: Record<EstimateConfidence, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
};

export const CONFIDENCE_MODIFIERS: Record<EstimateConfidence, 'red' | 'amber' | 'green'> = {
  LOW: 'red',
  MEDIUM: 'amber',
  HIGH: 'green',
};

/** Rubriques de la synthèse narrative, dans l'ordre du template. */
export const NARRATIVE_LABELS: Record<keyof BasisNarrativeInput, string> = {
  approach: 'Démarche',
  sources: "Sources d'information",
  assumptions: 'Hypothèses',
  constraints: 'Contraintes',
  rangeAndConfidence: 'Fourchette et confiance',
  risksAndReserves: 'Risques et réserves',
  approval: 'Approbation',
};

/** Composantes de l'estimation ascendante, hors main-d'œuvre (heures × taux). */
export const BOTTOM_UP_COMPONENTS = {
  material: 'Matériel',
  supplies: 'Fournitures',
  equipment: 'Équipements',
  travel: 'Déplacements',
  otherDirect: 'Autres coûts directs',
  indirect: 'Coûts indirects',
  reserve: 'Réserve',
} as const;

export const activityDirect = (activity: Pick<CostActivityInput, 'laborCost' | 'physicalCost'>): number =>
  activity.laborCost + activity.physicalCost;

// Miroir UX du calcul du domaine (cost-activity.ts) — le serveur reste l'autorité.
export function basisEstimate(basis: CostBasisInput): number {
  switch (basis.method) {
    case 'PARAMETRIC':
      return Math.round(basis.unitCost * basis.units);
    case 'ANALOGOUS':
      return Math.round(basis.previousCost * basis.multiplier);
    case 'THREE_POINT':
      return Math.round((basis.optimistic + 4 * basis.mostLikely + basis.pessimistic) / 6);
    case 'BOTTOM_UP':
      return Math.round(
        basis.laborHours * basis.laborRate +
          (Object.keys(BOTTOM_UP_COMPONENTS) as (keyof typeof BOTTOM_UP_COMPONENTS)[]).reduce(
            (total, key) => total + basis[key],
            0,
          ),
      );
  }
}

export function blankBasis(method: CostEstimateMethod): CostBasisInput {
  switch (method) {
    case 'PARAMETRIC':
      return { method, costVariable: '', unitCost: 0, units: 0 };
    case 'ANALOGOUS':
      return { method, previousActivity: '', previousCost: 0, multiplier: 1 };
    case 'THREE_POINT':
      return { method, optimistic: 0, mostLikely: 0, pessimistic: 0 };
    case 'BOTTOM_UP':
      return {
        method,
        laborHours: 0,
        laborRate: 0,
        material: 0,
        supplies: 0,
        equipment: 0,
        travel: 0,
        otherDirect: 0,
        indirect: 0,
        reserve: 0,
      };
  }
}

export function blankActivity(activities: readonly CostActivityInput[]): CostActivityInput {
  return {
    code: nextCode(activities, 'A'),
    wbsCode: '',
    name: '',
    resourceId: '',
    laborCost: 0,
    physicalCost: 0,
    physicalCostNote: '',
    method: 'ANALOGOUS',
    rangePct: 20,
    confidence: 'MEDIUM',
    basis: null,
  };
}

export function blankCostEstimates(): CostEstimatesInput {
  return {
    preparedOn: todayIso(),
    activities: [],
    contingencyReserve: 0,
    managementReserve: 0,
    narrative: { approach: '', sources: '', assumptions: '', constraints: '', rangeAndConfidence: '', risksAndReserves: '', approval: '' },
  };
}

export function costEstimatesDtoToInput(dto: CostEstimatesDto): CostEstimatesInput {
  const { projectId: _projectId, summary: _summary, basisEstimates: _basis, charterBudget: _budget, ...input } = dto;
  return structuredClone(input);
}

const PERCENT_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Pourcentage à une décimale au plus, ex. « 55,9 % ». */
export function formatPercent(value: number): string {
  return `${PERCENT_FR.format(value)} %`;
}

const MONTH_FR = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const MONTH_SHORT_FR = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });

/** Mois « YYYY-MM » lisible, ex. « févr. 2025 » (ou « févr. » en version courte). */
export function formatPeriod(period: string, short = false): string {
  const date = new Date(`${period}-01T00:00:00Z`);
  return (short ? MONTH_SHORT_FR : MONTH_FR).format(date);
}
