import 'dotenv/config';
import { buildContainer } from '@infrastructure/config/container';
import { loadEnv } from '@infrastructure/config/env';
import { buildServer } from '@infrastructure/http/server';

/** Point d'entrée : charge la config, câble le conteneur, démarre le serveur. */
async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const container = await buildContainer(env);
  const app = await buildServer(container, env);

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(
      `Persistance : ${env.DATABASE_URL ? 'PostgreSQL' : 'en mémoire (volatile)'}`,
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
