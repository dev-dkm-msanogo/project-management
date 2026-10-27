import type { RiskEntry } from '@domain/entities/risk-entry';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

/** Nombre de risques majeurs remontés au rapport exécutif. */
export const MAJOR_RISKS_LIMIT = 5;

/** Du plus critique au moins critique ; à score égal, ordre des codes (stable). */
const byCriticality = (a: RiskEntry, b: RiskEntry): number =>
  b.score - a.score || a.code.localeCompare(b.code);

/**
 * Agrégat racine : le registre des risques d'un projet.
 * Un registre vide est un état valide (aucun risque identifié pour l'instant).
 */
export class RiskRegister {
  private constructor(
    public readonly projectId: string,
    public readonly risks: readonly RiskEntry[],
  ) {}

  static create(params: { projectId: string; risks: readonly RiskEntry[] }): RiskRegister {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.risks, 'de risque');
    return new RiskRegister(params.projectId, [...params.risks]);
  }

  static empty(projectId: string): RiskRegister {
    return RiskRegister.create({ projectId, risks: [] });
  }

  get openRisks(): readonly RiskEntry[] {
    return this.risks.filter((risk) => risk.isOpen);
  }

  /** Risques majeurs, du plus critique au moins critique, plafonnés à `limit`. */
  majorRisks(limit = MAJOR_RISKS_LIMIT): readonly RiskEntry[] {
    return this.risks
      .filter((risk) => risk.isMajor)
      .sort(byCriticality)
      .slice(0, limit);
  }
}
