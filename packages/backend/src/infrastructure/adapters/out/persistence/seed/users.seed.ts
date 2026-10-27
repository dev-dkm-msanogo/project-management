import { User } from '@domain/entities/user';
import type { Role } from '@domain/value-objects/role';
import type { PasswordHasher } from '@application/ports/out/password-hasher';
import type { UserRepository } from '@application/ports/out/user.repository';

interface DefaultUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  password: string;
}

/**
 * Utilisateurs de démonstration (mots de passe par défaut — à CHANGER en production).
 */
const DEFAULT_USERS: readonly DefaultUser[] = [
  { id: 'u-admin', email: 'admin@dkm.sn', name: 'Awa Diop', role: 'ADMIN', password: 'admin1234' },
  { id: 'u-editor', email: 'editor@dkm.sn', name: 'Mamadou Ba', role: 'EDITOR', password: 'editor1234' },
  { id: 'u-viewer', email: 'viewer@dkm.sn', name: 'Fatou Sow', role: 'VIEWER', password: 'viewer1234' },
];

/** Crée les utilisateurs de démonstration (hachage des mots de passe). */
export async function seedUsers(
  repository: UserRepository,
  hasher: PasswordHasher,
): Promise<void> {
  for (const user of DEFAULT_USERS) {
    const passwordHash = await hasher.hash(user.password);
    await repository.save(
      User.create({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      }),
    );
  }
}
