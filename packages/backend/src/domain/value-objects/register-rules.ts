import { DomainError } from '@domain/errors/domain-errors';

/** Règles communes aux registres d'un projet (risques, parties prenantes, hypothèses…). */

const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Code d'une entrée de registre : lettres, chiffres, tirets (ex. R-001, PP-004). */
export const ENTRY_CODE_PATTERN = /^[A-Za-z0-9-]{1,20}$/;

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

export function assertProjectId(projectId: string): void {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new DomainError(`Identifiant de projet invalide : "${projectId}".`);
  }
}

/** Codes uniques sans distinction de casse (R-001 et r-001 désignent la même entrée). */
export function assertUniqueCodes(entries: readonly { code: string }[], label: string): void {
  const codes = new Set<string>();
  for (const entry of entries) {
    const key = entry.code.toUpperCase();
    if (codes.has(key)) {
      throw new DomainError(`Code ${label} en double : "${entry.code}".`);
    }
    codes.add(key);
  }
}

export function entryCode(value: string, label: string): string {
  const code = value.trim();
  if (!ENTRY_CODE_PATTERN.test(code)) {
    throw new DomainError(`Code ${label} invalide : "${value}".`);
  }
  return code;
}

export function requiredText(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DomainError(message);
  }
  return trimmed;
}

/** Noms uniques sans distinction de casse (rôles, fournisseurs, critères…). */
export function assertUniqueNames(names: readonly string[], message: (name: string) => string): void {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name.toLowerCase())) throw new DomainError(message(name));
    seen.add(name.toLowerCase());
  }
}

export function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Note entière de 1 à 5. */
export function scaleValue(value: number, label: string): number {
  if (!Number.isInteger(value) || value < SCALE_MIN || value > SCALE_MAX) {
    throw new DomainError(`${label} doit être un entier de ${SCALE_MIN} à ${SCALE_MAX}.`);
  }
  return value;
}
