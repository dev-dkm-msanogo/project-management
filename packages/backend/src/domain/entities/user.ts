import { DomainError } from '@domain/errors/domain-errors';
import { isRole, type Role } from '@domain/value-objects/role';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProps {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  /** Compte désactivé : plus aucune connexion ni session. */
  active?: boolean;
  /** Mot de passe provisoire, à remplacer avant tout autre accès. */
  mustChangePassword?: boolean;
  lastLoginAt?: Date | null;
  /** Les sessions ouvertes avant cette date (à la seconde) sont révoquées. */
  sessionsValidAfter?: Date | null;
}

/** Date tronquée à la seconde (résolution du champ `iat` des jetons de session). */
const toSecond = (date: Date): Date => new Date(Math.floor(date.getTime() / 1000) * 1000);

/**
 * Utilisateur authentifiable. Ne porte que le HASH du mot de passe (jamais le clair).
 * Immuable : chaque changement (rôle, activation, mot de passe) produit un nouvel objet.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: Role,
    public readonly passwordHash: string,
    public readonly active: boolean,
    public readonly mustChangePassword: boolean,
    public readonly lastLoginAt: Date | null,
    public readonly sessionsValidAfter: Date | null,
  ) {}

  static create(params: UserProps): User {
    if (!params.id.trim()) {
      throw new DomainError("L'identifiant utilisateur est requis.");
    }
    if (!EMAIL_PATTERN.test(params.email.trim())) {
      throw new DomainError('Adresse e-mail invalide.');
    }
    if (!params.name.trim()) {
      throw new DomainError("Le nom de l'utilisateur est requis.");
    }
    if (!isRole(params.role)) {
      throw new DomainError(`Rôle invalide : "${params.role}".`);
    }
    if (!params.passwordHash) {
      throw new DomainError('Le hash du mot de passe est requis.');
    }
    return new User(
      params.id.trim(),
      params.email.trim().toLowerCase(),
      params.name.trim(),
      params.role,
      params.passwordHash,
      params.active ?? true,
      params.mustChangePassword ?? false,
      params.lastLoginAt ?? null,
      params.sessionsValidAfter ? toSecond(params.sessionsValidAfter) : null,
    );
  }

  private with(changes: Partial<UserProps>): User {
    return User.create({ ...this.props, ...changes });
  }

  get props(): Required<UserProps> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      passwordHash: this.passwordHash,
      active: this.active,
      mustChangePassword: this.mustChangePassword,
      lastLoginAt: this.lastLoginAt,
      sessionsValidAfter: this.sessionsValidAfter,
    };
  }

  /** Profil et droits ; une désactivation révoque aussitôt les sessions ouvertes. */
  updated(changes: { email: string; name: string; role: Role; active: boolean }, now: Date): User {
    const deactivated = this.active && !changes.active;
    return this.with({ ...changes, sessionsValidAfter: deactivated ? now : this.sessionsValidAfter });
  }

  /** Nouveau mot de passe ; les sessions ouvertes jusqu'ici sont révoquées. */
  withPassword(passwordHash: string, options: { temporary: boolean; now: Date }): User {
    return this.with({ passwordHash, mustChangePassword: options.temporary, sessionsValidAfter: options.now });
  }

  loggedIn(at: Date): User {
    return this.with({ lastLoginAt: at });
  }

  /** Session ouverte à `issuedAt` (secondes) encore valable pour ce compte. */
  acceptsSessionIssuedAt(issuedAtSeconds: number | undefined): boolean {
    if (!this.active) return false;
    if (!this.sessionsValidAfter) return true;
    return issuedAtSeconds !== undefined && issuedAtSeconds * 1000 >= this.sessionsValidAfter.getTime();
  }
}
