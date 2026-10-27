/** Dates « jour » échangées en ISO-8601 (YYYY-MM-DD), interprétées en UTC. */

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoDateOrNull(date: Date | null): string | null {
  return date ? isoDate(date) : null;
}

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function parseIsoDateOrNull(iso: string | null): Date | null {
  return iso ? parseIsoDate(iso) : null;
}
