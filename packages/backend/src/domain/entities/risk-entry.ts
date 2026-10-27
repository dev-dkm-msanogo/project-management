import { DomainError } from '@domain/errors/domain-errors';
import { isTrendDirection, type TrendDirection } from '@domain/value-objects/classifications';
import {
  isRiskCategory,
  isRiskStatus,
  isRiskType,
  RISK_SCALE_MAX,
  RISK_SCALE_MIN,
  riskLevel,
  strategiesFor,
  type RiskCategory,
  type RiskLevel,
  type RiskStatus,
  type RiskStrategy,
  type RiskType,
} from '@domain/value-objects/risk-classifications';

const CODE_PATTERN = /^[A-Za-z0-9-]{1,20}$/;
const STATUSES_REQUIRING_STRATEGY: readonly RiskStatus[] = ['RESPONSE_PLANNED', 'RESPONSE_IN_PROGRESS'];

/** Impact sur chaque objectif (périmètre, qualité, délai, coût), de 1 à 5. */
export interface RiskImpacts {
  scope: number;
  quality: number;
  time: number;
  cost: number;
}

export const RISK_OBJECTIVES = ['scope', 'quality', 'time', 'cost'] as const satisfies readonly (keyof RiskImpacts)[];

const OBJECTIVE_LABELS: Record<keyof RiskImpacts, string> = {
  scope: 'périmètre',
  quality: 'qualité',
  time: 'délai',
  cost: 'coût',
};

export interface RiskEntryProps {
  code: string;
  title: string;
  description: string | null;
  type: RiskType;
  category: RiskCategory;
  probability: number;
  impacts: RiskImpacts;
  strategy: RiskStrategy | null;
  response: string | null;
  trigger: string | null;
  /** Ressource du référentiel (identifiant). */
  ownerId: string;
  status: RiskStatus;
  trend: TrendDirection;
  dueDate: Date | null;
  lastReviewedOn: Date | null;
  residualProbability: number | null;
  residualImpact: number | null;
  comments: string | null;
}

function scale(value: number, label: string, code: string): number {
  if (!Number.isInteger(value) || value < RISK_SCALE_MIN || value > RISK_SCALE_MAX) {
    throw new DomainError(
      `${label} du risque ${code} doit être un entier de ${RISK_SCALE_MIN} à ${RISK_SCALE_MAX}.`,
    );
  }
  return value;
}

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Entrée du registre des risques (template « Risk Register ») : identification (17), analyse
 * par objectif (18), réponse et risque résiduel (19), suivi (29, 38). L'impact retenu est le plus
 * fort des quatre objectifs ; score, criticité et score résiduel sont calculés.
 */
export class RiskEntry {
  private constructor(private readonly props: RiskEntryProps) {}

  static create(params: RiskEntryProps): RiskEntry {
    const code = params.code.trim();
    if (!CODE_PATTERN.test(code)) {
      throw new DomainError(`Code de risque invalide : "${params.code}".`);
    }
    if (!params.title.trim()) {
      throw new DomainError(`L'intitulé du risque ${code} est requis.`);
    }
    if (!params.ownerId.trim()) {
      throw new DomainError(`${code} : choisissez le propriétaire du risque dans le référentiel des ressources.`);
    }
    if (!isRiskType(params.type) || !isRiskCategory(params.category)) {
      throw new DomainError(`Type ou catégorie invalide pour le risque ${code}.`);
    }
    if (!isRiskStatus(params.status) || !isTrendDirection(params.trend)) {
      throw new DomainError(`Statut ou tendance invalide pour le risque ${code}.`);
    }
    if (params.strategy && !strategiesFor(params.type).includes(params.strategy)) {
      throw new DomainError(
        `La stratégie ${params.strategy} ne s'applique pas à ce type de risque (${code}).`,
      );
    }
    if (!params.strategy && STATUSES_REQUIRING_STRATEGY.includes(params.status)) {
      throw new DomainError(`Une réponse planifiée exige une stratégie (risque ${code}).`);
    }
    if ((params.residualProbability === null) !== (params.residualImpact === null)) {
      throw new DomainError(`Le risque résiduel de ${code} se renseigne en probabilité et en impact.`);
    }
    const impacts = Object.fromEntries(
      RISK_OBJECTIVES.map((objective) => [
        objective,
        scale(params.impacts[objective], `L'impact sur le ${OBJECTIVE_LABELS[objective]}`, code),
      ]),
    ) as unknown as RiskImpacts;

    return new RiskEntry({
      ...params,
      code,
      title: params.title.trim(),
      description: optionalText(params.description),
      probability: scale(params.probability, 'La probabilité', code),
      impacts,
      response: optionalText(params.response),
      trigger: optionalText(params.trigger),
      ownerId: params.ownerId.trim(),
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
      lastReviewedOn: params.lastReviewedOn ? new Date(params.lastReviewedOn) : null,
      residualProbability:
        params.residualProbability === null ? null : scale(params.residualProbability, 'La probabilité résiduelle', code),
      residualImpact: params.residualImpact === null ? null : scale(params.residualImpact, "L'impact résiduel", code),
      comments: optionalText(params.comments),
    });
  }

  get code(): string {
    return this.props.code;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string | null {
    return this.props.description;
  }
  get type(): RiskType {
    return this.props.type;
  }
  get category(): RiskCategory {
    return this.props.category;
  }
  get probability(): number {
    return this.props.probability;
  }
  get impacts(): RiskImpacts {
    return { ...this.props.impacts };
  }
  /** Impact retenu : le plus fort des quatre objectifs. */
  get impact(): number {
    return Math.max(...RISK_OBJECTIVES.map((objective) => this.props.impacts[objective]));
  }
  get trigger(): string | null {
    return this.props.trigger;
  }
  get residualProbability(): number | null {
    return this.props.residualProbability;
  }
  get residualImpact(): number | null {
    return this.props.residualImpact;
  }
  get comments(): string | null {
    return this.props.comments;
  }
  get strategy(): RiskStrategy | null {
    return this.props.strategy;
  }
  get response(): string | null {
    return this.props.response;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get status(): RiskStatus {
    return this.props.status;
  }
  get trend(): TrendDirection {
    return this.props.trend;
  }
  get dueDate(): Date | null {
    return this.props.dueDate ? new Date(this.props.dueDate) : null;
  }
  get lastReviewedOn(): Date | null {
    return this.props.lastReviewedOn ? new Date(this.props.lastReviewedOn) : null;
  }

  /** Score de criticité = probabilité × impact retenu (1–25). */
  get score(): number {
    return this.props.probability * this.impact;
  }

  get level(): RiskLevel {
    return riskLevel(this.score);
  }

  /** Score après la réponse (`null` tant que le risque résiduel n'est pas évalué). */
  get residualScore(): number | null {
    const { residualProbability, residualImpact } = this.props;
    return residualProbability === null || residualImpact === null ? null : residualProbability * residualImpact;
  }

  get residualLevel(): RiskLevel | null {
    return this.residualScore === null ? null : riskLevel(this.residualScore);
  }

  /** Un risque reste ouvert tant qu'il n'est pas clos. */
  get isOpen(): boolean {
    return this.props.status !== 'CLOSED';
  }

  /** Risque majeur (remonté au rapport exécutif) : ouvert et de criticité élevée ou critique. */
  get isMajor(): boolean {
    return this.isOpen && (this.level === 'HIGH' || this.level === 'CRITICAL');
  }
}
