import { DomainError } from '@domain/errors/domain-errors';
import { costAmount, type CostActivity } from '@domain/entities/cost-activity';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

export const NARRATIVE_KEYS = [
  'approach',
  'sources',
  'assumptions',
  'constraints',
  'rangeAndConfidence',
  'risksAndReserves',
  'approval',
] as const;

/** Synthèse narrative de la base des estimations. */
export type BasisNarrative = Record<(typeof NARRATIVE_KEYS)[number], string>;

export interface CostEstimatesProps {
  projectId: string;
  preparedOn: Date;
  activities: readonly CostActivity[];
  contingencyReserve: number;
  managementReserve: number;
  narrative: BasisNarrative;
}

export interface CostSummary {
  labor: number;
  physical: number;
  direct: number;
  contingencyReserve: number;
  costBaseline: number;
  managementReserve: number;
  totalFunding: number;
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * Agrégat racine : les estimations des coûts d'un projet et leur base. La cascade suit
 * le template : coûts directs + réserve pour aléas = référence des coûts (BAC) ; la réserve
 * de management, détenue par le sponsor, s'y ajoute pour le financement total requis.
 */
export class CostEstimates {
  private constructor(readonly props: Readonly<CostEstimatesProps>) {}

  static create(params: CostEstimatesProps): CostEstimates {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation des estimations invalide.');
    }
    assertUniqueCodes(params.activities, "d'activité");

    return new CostEstimates(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        activities: [...params.activities],
        contingencyReserve: costAmount(params.contingencyReserve, 'La réserve pour aléas'),
        managementReserve: costAmount(params.managementReserve, 'La réserve de management'),
        narrative: Object.fromEntries(
          NARRATIVE_KEYS.map((key) => [key, params.narrative[key].trim()]),
        ) as BasisNarrative,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get summary(): CostSummary {
    const labor = sum(this.props.activities.map((activity) => activity.props.laborCost));
    const physical = sum(this.props.activities.map((activity) => activity.props.physicalCost));
    const direct = labor + physical;
    const costBaseline = direct + this.props.contingencyReserve;
    return {
      labor,
      physical,
      direct,
      contingencyReserve: this.props.contingencyReserve,
      costBaseline,
      managementReserve: this.props.managementReserve,
      totalFunding: costBaseline + this.props.managementReserve,
    };
  }
}
