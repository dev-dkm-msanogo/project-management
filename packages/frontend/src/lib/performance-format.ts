import type {
  ActualCostInput,
  ActualCostNature,
  ActualCostsDto,
  ActualCostsInput,
  MyTaskDto,
  TaskDto,
  TaskProgressInput,
} from '@shared/index';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';

/** Libellés et règles d'affichage du pilotage : santé des indices, natures de coût, saisies vierges. */

export type IndexHealth = 'good' | 'watch' | 'critical';

/** Indice de performance (SPI, CPI) : ≥ 0,95 dans les clous, ≥ 0,90 à surveiller, sinon critique. */
export function indexHealth(value: number | null): IndexHealth | null {
  if (value === null) return null;
  if (value >= 0.95) return 'good';
  if (value >= 0.9) return 'watch';
  return 'critical';
}

export const HEALTH_LABELS: Record<IndexHealth, string> = {
  good: 'Dans les clous',
  watch: 'À surveiller',
  critical: 'Critique',
};

/** Pictogramme associé : la santé n'est jamais portée par la couleur seule. */
export const HEALTH_ICONS: Record<IndexHealth, string> = {
  good: '✓',
  watch: '!',
  critical: '✕',
};

const INDEX_FR = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Indice à deux décimales, « — » sans mesure. */
export function formatIndex(value: number | null): string {
  return value === null ? '—' : INDEX_FR.format(value);
}

export const ACTUAL_COST_NATURE_LABELS: Record<ActualCostNature, string> = {
  LABOR: "Main-d'œuvre",
  PHYSICAL: 'Coûts physiques',
};

export function blankActualCost(entries: readonly ActualCostInput[], wbsCode = ''): ActualCostInput {
  return {
    code: nextCode(entries, 'D'),
    date: todayIso(),
    wbsCode,
    nature: 'LABOR',
    description: '',
    supplier: '',
    reference: '',
    amount: 0,
  };
}

export function actualCostsDtoToInput(dto: ActualCostsDto): ActualCostsInput {
  return structuredClone({ entries: dto.entries });
}

/** Formulaire d'avancement prérempli : la dernière mesure, sinon « non commencée » au jour même. */
export function progressFormOf(task: Pick<TaskDto | MyTaskDto, 'progress' | 'status' | 'percentComplete'>): TaskProgressInput {
  if (task.progress) {
    const { status, percentComplete, actualStart, actualFinish, note } = task.progress;
    return { status, percentComplete, actualStart, actualFinish, note, asOf: todayIso() };
  }
  return { status: 'NOT_STARTED', percentComplete: 0, actualStart: null, actualFinish: null, asOf: todayIso(), note: null };
}
