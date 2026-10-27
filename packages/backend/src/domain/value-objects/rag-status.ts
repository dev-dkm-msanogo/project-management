import { DomainError } from '@domain/errors/domain-errors';

/** Niveaux RAG (Red / Amber / Green) + "non applicable". */
export const RAG_LEVELS = ['GREEN', 'AMBER', 'RED', 'NOT_APPLICABLE'] as const;
export type RagLevel = (typeof RAG_LEVELS)[number];

/** Gravité relative, utilisée pour la consolidation (roll-up) "pire cas". */
const SEVERITY: Record<RagLevel, number> = {
  NOT_APPLICABLE: 0,
  GREEN: 1,
  AMBER: 2,
  RED: 3,
};

/**
 * Objet-valeur RAG. Immuable, comparable, et capable de se consolider :
 * le statut global d'un projet est au moins aussi grave que sa pire dimension.
 */
export class RagStatus {
  private constructor(public readonly level: RagLevel) {}

  static of(level: RagLevel): RagStatus {
    if (!(level in SEVERITY)) {
      throw new DomainError(`Niveau RAG invalide : ${level}`);
    }
    return new RagStatus(level);
  }

  static green(): RagStatus {
    return new RagStatus('GREEN');
  }
  static amber(): RagStatus {
    return new RagStatus('AMBER');
  }
  static red(): RagStatus {
    return new RagStatus('RED');
  }
  static notApplicable(): RagStatus {
    return new RagStatus('NOT_APPLICABLE');
  }

  get severity(): number {
    return SEVERITY[this.level];
  }

  isWorseThan(other: RagStatus): boolean {
    return this.severity > other.severity;
  }

  equals(other: RagStatus): boolean {
    return this.level === other.level;
  }

  /** Consolidation "pire cas" en ignorant les dimensions non applicables. */
  static worst(statuses: readonly RagStatus[]): RagStatus {
    const applicable = statuses.filter((s) => s.level !== 'NOT_APPLICABLE');
    if (applicable.length === 0) {
      return RagStatus.notApplicable();
    }
    return applicable.reduce((worst, current) =>
      current.isWorseThan(worst) ? current : worst,
    );
  }
}
