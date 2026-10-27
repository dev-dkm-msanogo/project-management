import type { Role } from '@domain/value-objects/role';

/** Rôles dans un projet : chef de projet, contributeur, lecteur. */
export const PROJECT_ROLES = ['MANAGER', 'CONTRIBUTOR', 'READER'] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export function isProjectRole(value: string): value is ProjectRole {
  return (PROJECT_ROLES as readonly string[]).includes(value);
}

/** Droits sur le contenu du projet qu'ouvre un rôle : rédiger (chef de projet, contributeur) ou consulter. */
export function contentRoleOf(role: ProjectRole): Role {
  return role === 'READER' ? 'VIEWER' : 'EDITOR';
}
