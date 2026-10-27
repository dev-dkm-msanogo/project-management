import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

/** Types de contrat du template, du prix ferme à la régie. */
export const CONTRACT_TYPES = ['FFP', 'FPIF', 'FP_EPA', 'CPFF', 'CPIF', 'CPAF', 'TM', 'OTHER'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export interface ContractChoice {
  type: ContractType;
  note: string;
}

export interface ProcurementPhase {
  phase: string;
  entryCriteria: string;
  deliverables: string;
  exitCriteria: string;
}

export interface ProcurementStrategyProps {
  projectId: string;
  preparedOn: Date;
  deliveryMethod: string;
  makeOrBuy: string;
  contractTypes: readonly ContractChoice[];
  incentiveCriteria: string;
  lifecycle: readonly ProcurementPhase[];
  knowledgeTransfer: string;
}

/**
 * Agrégat racine : la stratégie d'approvisionnement (template PMI). Chaque type de contrat
 * retenu l'est une fois et dit à quoi il s'applique ; les phases du cycle d'achat sont uniques.
 */
export class ProcurementStrategy {
  private constructor(readonly props: Readonly<ProcurementStrategyProps>) {}

  static create(params: ProcurementStrategyProps): ProcurementStrategy {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation de la stratégie d'approvisionnement invalide.");
    }

    const types = new Set<string>();
    const contractTypes = params.contractTypes.map((choice) => {
      if (!(CONTRACT_TYPES as readonly string[]).includes(choice.type)) {
        throw new DomainError(`Type de contrat inconnu : ${choice.type}.`);
      }
      if (types.has(choice.type)) {
        throw new DomainError(`Le type de contrat ${choice.type} est retenu deux fois.`);
      }
      types.add(choice.type);
      return {
        type: choice.type,
        note: requiredText(choice.note, `Précisez à quoi s'applique le contrat ${choice.type} et pourquoi.`),
      };
    });

    const phases = new Set<string>();
    const lifecycle = params.lifecycle.map((item, index) => {
      const phase = requiredText(item.phase, `Nommez la phase n° ${index + 1} du cycle d'achat.`);
      if (phases.has(phase.toLowerCase())) {
        throw new DomainError(`Phase en double dans le cycle d'achat : « ${phase} ».`);
      }
      phases.add(phase.toLowerCase());
      return {
        phase,
        entryCriteria: item.entryCriteria.trim(),
        deliverables: item.deliverables.trim(),
        exitCriteria: item.exitCriteria.trim(),
      };
    });

    return new ProcurementStrategy(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        deliveryMethod: params.deliveryMethod.trim(),
        makeOrBuy: params.makeOrBuy.trim(),
        contractTypes,
        incentiveCriteria: params.incentiveCriteria.trim(),
        lifecycle,
        knowledgeTransfer: params.knowledgeTransfer.trim(),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
