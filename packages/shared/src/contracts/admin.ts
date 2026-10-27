/**
 * Contrats de l'administration : comptes utilisateurs (ADMIN) et référentiel partagé des
 * ressources de l'organisation (lecture pour tous, écriture ADMIN). Dates en ISO-8601.
 */
import type { Role, UserDto } from './auth';

/** Longueur minimale d'un mot de passe (miroir de la politique du serveur). */
export const PASSWORD_MIN_LENGTH = 12;

export interface UserAdminDto extends UserDto {
  active: boolean;
  /** Dernière connexion réussie (date et heure ISO), ou null. */
  lastLoginAt: string | null;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: Role;
}

export interface UpdateUserInput {
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

/** Compte avec son mot de passe provisoire, affiché une seule fois. */
export interface UserCredentialsDto {
  user: UserAdminDto;
  temporaryPassword: string;
}

export type ResourceKind = 'INTERNAL' | 'EXTERNAL';

export interface DirectoryResourceInput {
  name: string;
  kind: ResourceKind;
  /** Fonction ou métier (ex. « Architecte solution »). */
  jobTitle: string;
  /** Service (interne) ou entreprise (prestataire). */
  department: string;
  /** Adresse professionnelle uniquement (RGPD). */
  email: string | null;
  skills: string[];
  /** Compte utilisateur rattaché, au plus un par ressource. */
  userId: string | null;
  active: boolean;
}

export interface DirectoryResourceDto extends DirectoryResourceInput {
  id: string;
}

export interface ResourceDirectoryDto {
  resources: DirectoryResourceDto[];
}
