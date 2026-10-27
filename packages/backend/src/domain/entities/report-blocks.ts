import { DomainError } from '@domain/errors/domain-errors';
import { Percentage } from '@domain/value-objects/percentage';
import type { RagStatus } from '@domain/value-objects/rag-status';

/**
 * Parties rédigées du rapport exécutif (objets-valeur immuables) : le jugement du chef de projet.
 * Tout le reste (jalons, périmètre, délai, coût, changements…) est calculé à partir du projet.
 */

const OVERRIDE_REASON_MIN = 10;

/**
 * 1. Statut global. Le niveau est calculé (la pire des dimensions) ; le chef de projet peut en
 * retenir un autre, à condition de le justifier — la justification est publiée avec le rapport.
 */
export class OverallStatus {
  private constructor(
    public readonly statement: string,
    public readonly override: RagStatus | null,
    public readonly overrideReason: string | null,
  ) {}

  static create(params: { statement: string; override: RagStatus | null; overrideReason: string | null }): OverallStatus {
    if (!params.statement.trim()) {
      throw new DomainError('Le statut global doit comporter un énoncé.');
    }
    const reason = params.overrideReason?.trim() || null;
    if (params.override && (!reason || reason.length < OVERRIDE_REASON_MIN)) {
      throw new DomainError(
        `Ajuster le statut calculé demande une justification (${OVERRIDE_REASON_MIN} caractères au moins).`,
      );
    }
    return new OverallStatus(params.statement.trim(), params.override, params.override ? reason : null);
  }

  /** Niveau publié : l'ajustement s'il existe, sinon le niveau calculé. */
  levelFrom(computed: RagStatus): RagStatus {
    return this.override ?? computed;
  }
}

/** 2. Résumé exécutif. */
export class ExecutiveSummary {
  private constructor(public readonly narrative: string) {}

  static create(narrative: string): ExecutiveSummary {
    if (!narrative.trim()) {
      throw new DomainError('Le résumé exécutif est requis.');
    }
    return new ExecutiveSummary(narrative.trim());
  }
}

/** 10. Priorité de la période suivante. */
export class NextPeriodPriority {
  private constructor(
    public readonly description: string,
    public readonly done: boolean,
  ) {}

  static create(description: string, done = false): NextPeriodPriority {
    if (!description.trim()) {
      throw new DomainError('Une priorité doit avoir une description.');
    }
    return new NextPeriodPriority(description.trim(), done);
  }
}

/** 12. Confiance du chef de projet dans la prévision calculée. Le libellé dérive du pourcentage. */
export class ForecastConfidence {
  private constructor(
    public readonly confidence: Percentage,
    public readonly statement: string,
  ) {}

  static create(confidence: number, statement: string): ForecastConfidence {
    return new ForecastConfidence(Percentage.of(confidence), statement.trim());
  }

  get label(): string {
    if (this.confidence.value >= 75) return 'Confiance élevée';
    if (this.confidence.value >= 50) return 'Confiance modérée';
    return 'Confiance faible';
  }
}
