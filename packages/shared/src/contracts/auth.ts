/** Contrats d'authentification et de rôles (RBAC). */

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Mot de passe provisoire : à remplacer avant tout autre accès. */
  mustChangePassword: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Changement de son propre mot de passe. */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
