import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, optionalText, requiredText } from '@domain/value-objects/register-rules';

export const ALTERNATIVE_OUTCOMES = ['SELECTED', 'REJECTED'] as const;
export type AlternativeOutcome = (typeof ALTERNATIVE_OUTCOMES)[number];

export const FINANCIAL_LINE_KINDS = ['COST', 'BENEFIT'] as const;
export type FinancialLineKind = (typeof FINANCIAL_LINE_KINDS)[number];

/** Horizon de la synthèse financière du template : trois années. */
export const FINANCIAL_YEARS = 3;

export interface BusinessAlternative {
  option: string;
  description: string;
  cost: string;
  outcome: AlternativeOutcome;
  rationale: string;
}

export interface FinancialLine {
  label: string;
  kind: FinancialLineKind;
  amounts: readonly number[];
}

export interface BusinessCaseProps {
  projectId: string;
  preparedOn: Date;
  businessNeed: string;
  strategicAlignment: string;
  situation: readonly string[];
  alternatives: readonly BusinessAlternative[];
  recommendedSolution: string;
  financialLines: readonly FinancialLine[];
  financialNote: string | null;
  keyRisks: readonly string[];
  recommendation: string;
}

export interface FinancialSummary {
  totalCost: number[];
  totalBenefits: number[];
  netBenefit: number[];
  total: { cost: number; benefits: number; net: number };
}

function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * Agrégat racine : le business case d'un projet (justification économique). Il compare
 * les alternatives, en retient une au plus, et chiffre coûts et bénéfices sur trois ans ;
 * totaux et bénéfice net sont calculés.
 */
export class BusinessCase {
  private constructor(readonly props: Readonly<BusinessCaseProps>) {}

  static create(params: BusinessCaseProps): BusinessCase {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du business case invalide.');
    }

    const alternatives = params.alternatives.map((item, index) => {
      if (!(ALTERNATIVE_OUTCOMES as readonly string[]).includes(item.outcome)) {
        throw new DomainError(`Décision invalide pour l'alternative n° ${index + 1}.`);
      }
      return {
        option: requiredText(item.option, `L'alternative n° ${index + 1} doit être nommée.`),
        description: item.description.trim(),
        cost: item.cost.trim(),
        outcome: item.outcome,
        rationale: item.rationale.trim(),
      };
    });
    if (alternatives.filter((item) => item.outcome === 'SELECTED').length > 1) {
      throw new DomainError('Une seule alternative peut être retenue.');
    }

    const financialLines = params.financialLines.map((line, index) => {
      if (!(FINANCIAL_LINE_KINDS as readonly string[]).includes(line.kind)) {
        throw new DomainError(`Nature invalide pour la ligne financière n° ${index + 1}.`);
      }
      if (line.amounts.length !== FINANCIAL_YEARS || line.amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
        throw new DomainError(
          `La ligne financière n° ${index + 1} doit comporter ${FINANCIAL_YEARS} montants positifs ou nuls.`,
        );
      }
      return {
        label: requiredText(line.label, `La ligne financière n° ${index + 1} doit avoir un libellé.`),
        kind: line.kind,
        amounts: [...line.amounts],
      };
    });

    return new BusinessCase(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        businessNeed: requiredText(params.businessNeed, 'Le besoin métier est requis.'),
        strategicAlignment: params.strategicAlignment.trim(),
        situation: lines(params.situation),
        alternatives,
        recommendedSolution: params.recommendedSolution.trim(),
        financialLines,
        financialNote: optionalText(params.financialNote),
        keyRisks: lines(params.keyRisks),
        recommendation: params.recommendation.trim(),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Totaux par année et sur trois ans ; bénéfice net = bénéfices − coûts. */
  get financialSummary(): FinancialSummary {
    const yearly = (kind: FinancialLineKind) =>
      Array.from({ length: FINANCIAL_YEARS }, (_, year) =>
        sum(this.props.financialLines.filter((line) => line.kind === kind).map((line) => line.amounts[year]!)),
      );
    const totalCost = yearly('COST');
    const totalBenefits = yearly('BENEFIT');
    const netBenefit = totalBenefits.map((benefits, year) => benefits - totalCost[year]!);
    return {
      totalCost,
      totalBenefits,
      netBenefit,
      total: { cost: sum(totalCost), benefits: sum(totalBenefits), net: sum(netBenefit) },
    };
  }
}
