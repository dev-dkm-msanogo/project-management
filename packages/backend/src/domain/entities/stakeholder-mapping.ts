import { DomainError } from '@domain/errors/domain-errors';
import type { Stakeholder } from '@domain/entities/stakeholder';
import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { assertProjectId, entryCode } from '@domain/value-objects/register-rules';
import {
  HIGH_POWER,
  INFLUENCE_DIRECTIONS,
  salienceOf,
  type InfluenceDirection,
  type SalienceCategory,
} from '@domain/value-objects/stakeholder-classifications';

export interface StakeholderMappingEntry {
  stakeholderCode: string;
  urgency: boolean;
  legitimacy: boolean;
  direction: InfluenceDirection;
}

export interface StakeholderMappingProps {
  projectId: string;
  preparedOn: Date;
  entries: readonly StakeholderMappingEntry[];
}

/**
 * Agrégat racine : la cartographie des parties prenantes (template « Stakeholder Mapping and
 * Representation »). Une entrée par partie prenante du registre : urgence, légitimité et direction
 * d'influence ; le pouvoir reste celui du registre, qui sert aussi à la grille pouvoir / intérêt.
 */
export class StakeholderMapping {
  private constructor(readonly props: Readonly<StakeholderMappingProps>) {}

  static create(params: StakeholderMappingProps): StakeholderMapping {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation de la cartographie invalide.');
    }

    const seen = new Set<string>();
    const entries = params.entries.map((entry) => {
      const code = entryCode(entry.stakeholderCode, 'de partie prenante');
      if (seen.has(code.toUpperCase())) {
        throw new DomainError(`La partie prenante ${code} figure deux fois dans la cartographie.`);
      }
      seen.add(code.toUpperCase());
      if (!(INFLUENCE_DIRECTIONS as readonly string[]).includes(entry.direction)) {
        throw new DomainError(`Direction d'influence invalide pour ${code}.`);
      }
      return { stakeholderCode: code, urgency: entry.urgency, legitimacy: entry.legitimacy, direction: entry.direction };
    });

    return new StakeholderMapping(
      Object.freeze({ projectId: params.projectId, preparedOn: new Date(params.preparedOn), entries }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Entrées visant une partie prenante absente du registre (comparaison sans casse). */
  unknownStakeholders(register: StakeholderRegister): string[] {
    const known = new Set(register.stakeholders.map((stakeholder) => stakeholder.code.toUpperCase()));
    return this.props.entries.map((entry) => entry.stakeholderCode).filter((code) => !known.has(code.toUpperCase()));
  }

  /** Parties prenantes du registre encore absentes de la cartographie. */
  unmapped(register: StakeholderRegister): string[] {
    const mapped = new Set(this.props.entries.map((entry) => entry.stakeholderCode.toUpperCase()));
    return register.stakeholders
      .filter((stakeholder) => !mapped.has(stakeholder.code.toUpperCase()))
      .map((stakeholder) => stakeholder.code);
  }
}

/** Catégorie de saillance d'une entrée, avec le pouvoir lu dans le registre. */
export function salienceCategory(entry: StakeholderMappingEntry, stakeholder: Stakeholder | undefined): SalienceCategory {
  return salienceOf(hasPower(stakeholder), entry.urgency, entry.legitimacy);
}

/** Pouvoir du modèle de saillance : même seuil « élevé » que la grille pouvoir / intérêt. */
export function hasPower(stakeholder: Stakeholder | undefined): boolean {
  return (stakeholder?.props.power ?? 0) >= HIGH_POWER;
}
