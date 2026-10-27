import { DomainError } from '@domain/errors/domain-errors';
import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { assertProjectId, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const COMMUNICATION_STYLES = ['PUSH', 'PULL', 'INTERACTIVE'] as const;
export type CommunicationStyle = (typeof COMMUNICATION_STYLES)[number];

export interface EngagementApproach {
  stakeholderCode: string;
  approach: string;
  informationNeeds: string;
  frequency: string;
  method: string;
  styles: readonly CommunicationStyle[];
}

export interface StakeholderEngagementPlanProps {
  projectId: string;
  preparedOn: Date;
  approaches: readonly EngagementApproach[];
  pendingChanges: string;
  relationships: string;
}

/**
 * Agrégat racine : le plan d'engagement des parties prenantes (template PMI). Une approche par
 * partie prenante du registre, qui reste la source des niveaux d'engagement actuel et souhaité.
 */
export class StakeholderEngagementPlan {
  private constructor(readonly props: Readonly<StakeholderEngagementPlanProps>) {}

  static create(params: StakeholderEngagementPlanProps): StakeholderEngagementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation du plan d'engagement invalide.");
    }

    const seen = new Set<string>();
    const approaches = params.approaches.map((item) => {
      const code = entryCode(item.stakeholderCode, 'de partie prenante');
      if (seen.has(code.toUpperCase())) {
        throw new DomainError(`La partie prenante ${code} a déjà une approche dans le plan.`);
      }
      seen.add(code.toUpperCase());
      if (item.styles.some((style) => !(COMMUNICATION_STYLES as readonly string[]).includes(style))) {
        throw new DomainError(`Méthode de communication invalide pour ${code}.`);
      }
      return {
        stakeholderCode: code,
        approach: requiredText(item.approach, `Décrivez l'approche d'engagement de ${code}.`),
        informationNeeds: item.informationNeeds.trim(),
        frequency: item.frequency.trim(),
        method: item.method.trim(),
        styles: [...new Set(item.styles)],
      };
    });

    return new StakeholderEngagementPlan(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        approaches,
        pendingChanges: params.pendingChanges.trim(),
        relationships: params.relationships.trim(),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Approches visant une partie prenante absente du registre (comparaison sans casse). */
  unknownStakeholders(register: StakeholderRegister): string[] {
    const known = new Set(register.stakeholders.map((stakeholder) => stakeholder.code.toUpperCase()));
    return this.props.approaches
      .map((item) => item.stakeholderCode)
      .filter((code) => !known.has(code.toUpperCase()));
  }

  /** Parties prenantes à faire progresser (écart d'engagement positif) encore sans approche. */
  missingApproaches(register: StakeholderRegister): string[] {
    const covered = new Set(this.props.approaches.map((item) => item.stakeholderCode.toUpperCase()));
    return register.stakeholders
      .filter((stakeholder) => stakeholder.engagementGap > 0 && !covered.has(stakeholder.code.toUpperCase()))
      .map((stakeholder) => stakeholder.code);
  }
}
