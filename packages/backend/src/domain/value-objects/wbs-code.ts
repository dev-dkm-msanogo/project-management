import { DomainError } from '@domain/errors/domain-errors';

/**
 * Code WBS (Work Breakdown Structure), ex. "1", "1.2", "1.2.3".
 * Le niveau hiérarchique dérive du nombre de segments.
 */
export class WbsCode {
  private constructor(
    public readonly value: string,
    public readonly segments: readonly number[],
  ) {}

  static of(value: string): WbsCode {
    const normalized = value.trim();
    if (!/^\d+(\.\d+)*$/.test(normalized)) {
      throw new DomainError(`Code WBS invalide : "${value}" (format attendu : 1, 1.2, 1.2.3…).`);
    }
    const segments = normalized.split('.').map((segment) => Number(segment));
    return new WbsCode(normalized, segments);
  }

  /** Profondeur hiérarchique (1 = niveau racine / phase). */
  get level(): number {
    return this.segments.length;
  }

  equals(other: WbsCode): boolean {
    return this.value === other.value;
  }
}
