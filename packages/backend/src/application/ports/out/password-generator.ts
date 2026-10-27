/** Port SORTANT : génération de mots de passe provisoires (aléa cryptographique). */
export interface PasswordGenerator {
  temporaryPassword(): string;
}
