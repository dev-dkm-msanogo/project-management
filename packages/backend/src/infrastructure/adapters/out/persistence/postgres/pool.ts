import { Pool } from 'pg';

/** Crée un pool de connexions PostgreSQL à partir de l'URL de connexion. */
export function createPool(databaseUrl: string): Pool {
  return new Pool({ connectionString: databaseUrl, max: 10 });
}
