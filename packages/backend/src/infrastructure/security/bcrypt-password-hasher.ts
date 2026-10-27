import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '@application/ports/out/password-hasher';

const COST_FACTOR = 12;

/** Adaptateur SORTANT : hachage bcrypt (coût 12, recommandé OWASP). */
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, COST_FACTOR);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
