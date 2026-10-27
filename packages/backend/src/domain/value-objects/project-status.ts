/** Statut d'un projet dans le registre. */
export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'CLOSED'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}
