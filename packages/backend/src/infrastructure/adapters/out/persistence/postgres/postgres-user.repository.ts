import type { Pool } from 'pg';
import { User } from '@domain/entities/user';
import type { Role } from '@domain/value-objects/role';
import type { UserRepository } from '@application/ports/out/user.repository';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  active: boolean;
  must_change_password: boolean;
  last_login_at: Date | null;
  sessions_valid_after: Date | null;
}

const SELECT = `SELECT id, email, name, role, password_hash, active, must_change_password,
  last_login_at, sessions_valid_after FROM users`;

/** Adaptateur SORTANT PostgreSQL du registre des utilisateurs (requêtes paramétrées). */
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  private toUser(row: UserRow): User {
    return User.create({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as Role,
      passwordHash: row.password_hash,
      active: row.active,
      mustChangePassword: row.must_change_password,
      lastLoginAt: row.last_login_at,
      sessionsValidAfter: row.sessions_valid_after,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(`${SELECT} WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    const row = result.rows[0];
    return row ? this.toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(`${SELECT} WHERE id = $1`, [id]);
    const row = result.rows[0];
    return row ? this.toUser(row) : null;
  }

  async list(): Promise<User[]> {
    const result = await this.pool.query<UserRow>(`${SELECT} ORDER BY email ASC`);
    return result.rows.map((row) => this.toUser(row));
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, name, role, password_hash, active, must_change_password,
                          last_login_at, sessions_valid_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email, name = EXCLUDED.name,
             role = EXCLUDED.role, password_hash = EXCLUDED.password_hash,
             active = EXCLUDED.active, must_change_password = EXCLUDED.must_change_password,
             last_login_at = EXCLUDED.last_login_at, sessions_valid_after = EXCLUDED.sessions_valid_after`,
      [
        user.id,
        user.email,
        user.name,
        user.role,
        user.passwordHash,
        user.active,
        user.mustChangePassword,
        user.lastLoginAt,
        user.sessionsValidAfter,
      ],
    );
  }
}
