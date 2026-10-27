import { z } from 'zod';

/** Schéma de configuration : fail-fast si l'environnement est mal configuré. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3001),
  // Port propre à l'API, prioritaire sur PORT (qu'un outil peut imposer à tout le processus).
  API_PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  // Persistance : si défini, PostgreSQL ; sinon repli en mémoire.
  DATABASE_URL: z.string().min(1).optional(),
  // Authentification : secret de signature JWT (obligatoire en production).
  JWT_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN: z.string().default('8h'),
});

export type AppEnv = Omit<z.infer<typeof envSchema>, 'API_PORT'>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Configuration d'environnement invalide :\n${parsed.error.toString()}`,
    );
  }
  const { API_PORT, ...env } = parsed.data;
  return { ...env, PORT: API_PORT ?? env.PORT };
}
