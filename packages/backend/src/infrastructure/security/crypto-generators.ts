import { randomBytes, randomInt } from 'node:crypto';
import type { IdGenerator } from '@application/ports/out/id-generator';
import type { PasswordGenerator } from '@application/ports/out/password-generator';

/** Alphabet sans caractères ambigus (0/O, 1/l/I) : le mot de passe se dicte sans erreur. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const TEMPORARY_LENGTH = 16;

/** Adaptateur SORTANT : mots de passe provisoires tirés au hasard (aléa cryptographique). */
export class CryptoPasswordGenerator implements PasswordGenerator {
  temporaryPassword(): string {
    return Array.from({ length: TEMPORARY_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  }
}

/** Adaptateur SORTANT : identifiants « préfixe-8 caractères hexadécimaux ». */
export class CryptoIdGenerator implements IdGenerator {
  next(prefix: string): string {
    return `${prefix}-${randomBytes(4).toString('hex')}`;
  }
}
