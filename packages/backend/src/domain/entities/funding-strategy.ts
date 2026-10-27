import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueNames, requiredText } from '@domain/value-objects/register-rules';

export interface FundingTranche {
  name: string;
  period: string;
  releaseOn: Date;
  activities: string;
  amount: number;
}

export interface CostCategory {
  name: string;
  amount: number;
  description: string;
}

export interface FundingRisk {
  risk: string;
  mitigation: string;
}

export interface FundingStrategyProps {
  projectId: string;
  preparedOn: Date;
  source: string;
  approvedFundingNote: string;
  tranches: readonly FundingTranche[];
  releaseMechanism: string;
  costCategories: readonly CostCategory[];
  risks: readonly FundingRisk[];
}

const amountOf = (value: number, label: string, positive: boolean) => {
  if (!Number.isInteger(value) || value < 0 || (positive && value === 0)) {
    throw new DomainError(`${label} : montant entier ${positive ? 'strictement positif' : 'positif ou nul'} en FCFA attendu.`);
  }
  return value;
};

/**
 * Agrégat racine : la stratégie de financement (template « Funding Strategy ») : source et
 * autorité, tranches datées (une par date, rangées par date), mécanisme de déblocage, catégories
 * de coûts, risques. Le montant approuvé reste le budget de la charte.
 */
export class FundingStrategy {
  private constructor(readonly props: Readonly<FundingStrategyProps>) {}

  static create(params: FundingStrategyProps): FundingStrategy {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation de la stratégie de financement invalide.');
    }

    const tranches = params.tranches
      .map((tranche, index) => {
        const name = requiredText(tranche.name, `Tranche n° ${index + 1} : nommez la tranche.`);
        if (Number.isNaN(tranche.releaseOn.getTime())) throw new DomainError(`${name} : date de déblocage invalide.`);
        return {
          name,
          period: tranche.period.trim(),
          releaseOn: new Date(tranche.releaseOn),
          activities: tranche.activities.trim(),
          amount: amountOf(tranche.amount, name, true),
        };
      })
      .sort((a, b) => a.releaseOn.getTime() - b.releaseOn.getTime());
    assertUniqueNames(tranches.map((tranche) => tranche.name), (name) => `La tranche « ${name} » figure deux fois.`);
    tranches.forEach((tranche, index) => {
      if (index > 0 && tranche.releaseOn.getTime() === tranches[index - 1]!.releaseOn.getTime()) {
        throw new DomainError(`Deux tranches sont débloquées le même jour (${tranche.name}).`);
      }
    });

    const costCategories = params.costCategories.map((category, index) => {
      const name = requiredText(category.name, `Catégorie de coûts n° ${index + 1} : nommez la catégorie.`);
      return { name, amount: amountOf(category.amount, name, false), description: category.description.trim() };
    });
    assertUniqueNames(costCategories.map((category) => category.name), (name) => `La catégorie « ${name} » figure deux fois.`);

    const risks = params.risks.map((item, index) => ({
      risk: requiredText(item.risk, `Risque de financement n° ${index + 1} : décrivez le risque.`),
      mitigation: requiredText(item.mitigation, `Risque de financement n° ${index + 1} : précisez la parade.`),
    }));

    return new FundingStrategy(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        source: params.source.trim(),
        approvedFundingNote: params.approvedFundingNote.trim(),
        tranches,
        releaseMechanism: params.releaseMechanism.trim(),
        costCategories,
        risks,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get tranchesTotal(): number {
    return this.props.tranches.reduce((total, tranche) => total + tranche.amount, 0);
  }

  get categoriesTotal(): number {
    return this.props.costCategories.reduce((total, category) => total + category.amount, 0);
  }
}
