import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexte d'une requête HTTP : le compte qui agit, connu après l'authentification. Les adaptateurs
 * de persistance y lisent l'auteur de chaque version enregistrée.
 */
interface RequestContext {
  userId: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Ouvre le contexte de la requête (crochet `onRequest` à rappel : tout le traitement s'y déroule). */
export function runInRequestContext(done: () => void): void {
  storage.run({ userId: null }, done);
}

/** Retient le compte authentifié de la requête en cours. */
export function setRequestActor(userId: string): void {
  const context = storage.getStore();
  if (context) context.userId = userId;
}

/** Compte de la requête en cours (`null` : hors requête ou requête anonyme). */
export function requestActor(): string | null {
  return storage.getStore()?.userId ?? null;
}
