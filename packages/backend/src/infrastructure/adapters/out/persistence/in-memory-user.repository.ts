import type { User } from '@domain/entities/user';
import type { UserRepository } from '@application/ports/out/user.repository';

/** Adaptateur SORTANT : registre des utilisateurs en mémoire. */
export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();
  private readonly idByEmail = new Map<string, string>();

  constructor(seed: readonly User[] = []) {
    for (const user of seed) {
      this.index(user);
    }
  }

  private index(user: User): void {
    // Changement d'adresse : l'ancienne ne doit plus désigner ce compte.
    const previous = this.byId.get(user.id);
    if (previous && previous.email !== user.email) this.idByEmail.delete(previous.email);
    this.byId.set(user.id, user);
    this.idByEmail.set(user.email, user.id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = this.idByEmail.get(email.toLowerCase());
    return id ? this.byId.get(id) ?? null : null;
  }

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async list(): Promise<User[]> {
    return [...this.byId.values()];
  }

  async save(user: User): Promise<void> {
    this.index(user);
  }
}
