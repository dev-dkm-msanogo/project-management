import type { Stakeholder } from '@domain/entities/stakeholder';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

/** Du plus influent au moins influent ; à égalité, ordre des codes (stable). */
const byInfluence = (a: Stakeholder, b: Stakeholder): number =>
  b.props.power + b.props.interest - (a.props.power + a.props.interest) || a.code.localeCompare(b.code);

/**
 * Agrégat racine : le registre des parties prenantes d'un projet.
 * Un registre vide est un état valide (identification pas encore réalisée).
 */
export class StakeholderRegister {
  private constructor(
    public readonly projectId: string,
    public readonly stakeholders: readonly Stakeholder[],
  ) {}

  static create(params: { projectId: string; stakeholders: readonly Stakeholder[] }): StakeholderRegister {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.stakeholders, 'de partie prenante');
    return new StakeholderRegister(params.projectId, [...params.stakeholders]);
  }

  static empty(projectId: string): StakeholderRegister {
    return StakeholderRegister.create({ projectId, stakeholders: [] });
  }

  /** Parties prenantes de la plus à la moins influente (liste de la charte). */
  get rankedByInfluence(): readonly Stakeholder[] {
    return [...this.stakeholders].sort(byInfluence);
  }
}
