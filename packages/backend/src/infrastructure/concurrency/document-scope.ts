import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contrôle de concurrence optimiste des documents d'un projet (une ligne JSONB par projet et
 * une colonne `version`). La route HTTP ouvre une portée sur la table de SON document : le dépôt y
 * lit la version attendue avant d'écrire et y dépose la version lue ou écrite, que la route renvoie
 * en en-tête ETag. Les autres documents lus pendant la requête (références) ne la touchent pas.
 */

/**
 * Version attendue à l'écriture : un nombre = la version lue par le client (If-Match) ; `null` = le
 * document ne doit pas encore exister (If-None-Match: *) ; `undefined` = pas de contrôle.
 */
export type ExpectedVersion = number | null | undefined;

export interface DocumentScope {
  readonly table: string;
  readonly expected: ExpectedVersion;
  /** Lecture d'une version passée : le document tel qu'enregistré dans cette version. */
  readonly asOf?: number;
  /** Version lue ou écrite pendant la requête (`null` : document absent). */
  version: number | null;
}

const storage = new AsyncLocalStorage<DocumentScope>();

/** Exécute un cas d'utilisation dans la portée du document de la table donnée (éventuellement à une version passée). */
export async function withDocumentScope<R>(
  table: string,
  expected: ExpectedVersion,
  run: () => Promise<R>,
  asOf?: number,
): Promise<{ result: R; version: number | null }> {
  const scope: DocumentScope = { table, expected, asOf, version: null };
  const result = await storage.run(scope, run);
  return { result, version: scope.version };
}

/** Portée ouverte sur cette table pendant la requête en cours, s'il y en a une. */
export function scopeFor(table: string): DocumentScope | undefined {
  const scope = storage.getStore();
  return scope?.table === table ? scope : undefined;
}
