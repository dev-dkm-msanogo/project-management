import { DomainError } from '@domain/errors/domain-errors';
import {
  entryCode,
  optionalText,
  requiredText,
  scaleValue,
} from '@domain/value-objects/register-rules';
import {
  engagementRank,
  isEngagementLevel,
  isStakeholderType,
  quadrantOf,
  type EngagementLevel,
  type StakeholderQuadrant,
  type StakeholderType,
} from '@domain/value-objects/stakeholder-classifications';

export interface StakeholderProps {
  code: string;
  name: string;
  role: string;
  organization: string | null;
  type: StakeholderType;
  contact: string | null;
  power: number;
  interest: number;
  currentEngagement: EngagementLevel;
  desiredEngagement: EngagementLevel;
  requirements: string | null;
  expectations: string | null;
  strategy: string | null;
}

/**
 * Partie prenante : identification (2), analyse pouvoir / intérêt et engagement
 * actuel vs souhaité (14, 24, 36). Le quadrant et l'écart d'engagement sont calculés.
 */
export class Stakeholder {
  private constructor(readonly props: Readonly<StakeholderProps>) {}

  static create(params: StakeholderProps): Stakeholder {
    const code = entryCode(params.code, 'de partie prenante');
    if (!isStakeholderType(params.type)) {
      throw new DomainError(`Type invalide pour la partie prenante ${code}.`);
    }
    if (!isEngagementLevel(params.currentEngagement) || !isEngagementLevel(params.desiredEngagement)) {
      throw new DomainError(`Niveau d'engagement invalide pour la partie prenante ${code}.`);
    }
    return new Stakeholder(
      Object.freeze({
        ...params,
        code,
        name: requiredText(params.name, `Le nom de la partie prenante ${code} est requis.`),
        role: requiredText(params.role, `Le rôle de la partie prenante ${code} est requis.`),
        organization: optionalText(params.organization),
        contact: optionalText(params.contact),
        power: scaleValue(params.power, `Le pouvoir de la partie prenante ${code}`),
        interest: scaleValue(params.interest, `L'intérêt de la partie prenante ${code}`),
        requirements: optionalText(params.requirements),
        expectations: optionalText(params.expectations),
        strategy: optionalText(params.strategy),
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  get quadrant(): StakeholderQuadrant {
    return quadrantOf(this.props.power, this.props.interest);
  }

  /** Niveaux à gagner pour atteindre l'engagement souhaité (négatif : au-delà du besoin). */
  get engagementGap(): number {
    return engagementRank(this.props.desiredEngagement) - engagementRank(this.props.currentEngagement);
  }
}
