import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '@application/errors/application-errors';
import type { ListDocumentVersionsUseCase } from '@application/ports/in/governance.use-cases';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';
import { withDocumentScope, type ExpectedVersion } from '@infrastructure/concurrency/document-scope';

/**
 * En-têtes de concurrence optimiste : la lecture renvoie la version du document (ETag) ;
 * l'écriture la rappelle (If-Match) ou exige que le document n'existe pas encore (If-None-Match: *).
 * Sans ces en-têtes, l'écriture n'est pas contrôlée.
 */

const etag = z.string().trim().regex(/^(W\/)?"\d+"$/, 'En-tête If-Match invalide.');

export function expectedVersionOf(request: FastifyRequest): ExpectedVersion {
  const ifMatch = request.headers['if-match'];
  if (ifMatch !== undefined) return Number(etag.parse(ifMatch).replace(/\D/g, ''));
  return request.headers['if-none-match'] === '*' ? null : undefined;
}

/** Version du document dans la réponse ; jamais de mise en cache (données projet). */
export function sendVersion(reply: FastifyReply, version: number | null): void {
  reply.header('Cache-Control', 'no-store');
  if (version !== null) reply.header('ETag', `"${version}"`);
}

const versionQuerySchema = z.object({ version: z.coerce.number().int().positive().optional() });

/**
 * Lecture d'un document : sa version courante (ETag), ou une version passée avec `?version=N` (404 si
 * elle n'a jamais existé) — pour la consulter ou la restaurer.
 */
export async function readDocument<R>(
  request: FastifyRequest,
  reply: FastifyReply,
  table: string,
  versions: ListDocumentVersionsUseCase,
  read: () => Promise<R>,
): Promise<R> {
  const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
  const { version: asOf } = versionQuerySchema.parse(request.query);
  if (asOf !== undefined) {
    const history = await versions.execute({ document: table, projectId });
    if (!history.versions.some((entry) => entry.version === asOf)) {
      throw new NotFoundError(`La version ${asOf} de ce document n'existe pas.`);
    }
  }
  const { result, version } = await withDocumentScope(table, undefined, read, asOf);
  sendVersion(reply, version);
  return result;
}

/** Historique d'un document : GET …/versions (versions enregistrées, auteurs et dates). */
export function registerVersionsRoute(
  app: FastifyInstance,
  path: string,
  table: string,
  versions: ListDocumentVersionsUseCase,
): void {
  app.get(`${path}/versions`, async (request, reply) => {
    const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
    reply.header('Cache-Control', 'no-store');
    return versions.execute({ document: table, projectId });
  });
}
