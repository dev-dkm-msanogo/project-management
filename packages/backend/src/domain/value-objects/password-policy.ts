import { DomainError } from '@domain/errors/domain-errors';

/** Politique de mots de passe (OWASP ASVS) : longueur avant tout, sans règles de composition. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function assertPasswordPolicy(plain: string, context: { email: string }): void {
  if (plain.length < PASSWORD_MIN_LENGTH || plain.length > PASSWORD_MAX_LENGTH) {
    throw new DomainError(
      `Le mot de passe doit compter de ${PASSWORD_MIN_LENGTH} à ${PASSWORD_MAX_LENGTH} caractères.`,
    );
  }
  const lowered = plain.toLowerCase();
  if (lowered === context.email.toLowerCase() || lowered === context.email.split('@')[0]?.toLowerCase()) {
    throw new DomainError("Le mot de passe ne peut pas reprendre l'adresse e-mail.");
  }
  if (new Set(plain).size < 4) {
    throw new DomainError('Le mot de passe est trop répétitif.');
  }
}
