import type { User } from '@domain/entities/user';

/** Port SORTANT : registre des utilisateurs. */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  save(user: User): Promise<void>;
}
