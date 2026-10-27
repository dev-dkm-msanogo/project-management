import type { AssumptionEntry } from '@domain/entities/assumption-entry';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

/**
 * Agrégat racine : le registre des hypothèses et contraintes d'un projet.
 * Un registre vide est un état valide.
 */
export class AssumptionLog {
  private constructor(
    public readonly projectId: string,
    public readonly entries: readonly AssumptionEntry[],
  ) {}

  static create(params: { projectId: string; entries: readonly AssumptionEntry[] }): AssumptionLog {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.entries, "d'hypothèse ou de contrainte");
    return new AssumptionLog(params.projectId, [...params.entries]);
  }

  static empty(projectId: string): AssumptionLog {
    return AssumptionLog.create({ projectId, entries: [] });
  }

  get constraints(): readonly AssumptionEntry[] {
    return this.entries.filter((entry) => entry.props.kind === 'CONSTRAINT' && entry.isCurrent);
  }

  get currentAssumptions(): readonly AssumptionEntry[] {
    return this.entries.filter((entry) => entry.props.kind === 'ASSUMPTION' && entry.isCurrent);
  }

  /** Codes de risque référencés absents du registre des risques (comparaison sans casse). */
  unknownRiskReferences(knownRiskCodes: readonly string[]): string[] {
    const known = new Set(knownRiskCodes.map((code) => code.toUpperCase()));
    return this.entries
      .map((entry) => entry.props.riskCode)
      .filter((code): code is string => code !== null && !known.has(code.toUpperCase()));
  }
}
