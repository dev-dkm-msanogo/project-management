/** Rôles d'accès (RBAC). */
export const ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Droit de créer / modifier / supprimer rapports et plans, et de créer des projets. */
export function canEditContent(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

/** Droit d'administration (supprimer un projet, gérer les utilisateurs). */
export function canAdminister(role: Role): boolean {
  return role === 'ADMIN';
}
