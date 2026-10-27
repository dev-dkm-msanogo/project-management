import type { FastifyPluginAsync } from 'fastify';
import type { ZodType } from 'zod';
import type { ListDocumentVersionsUseCase } from '@application/ports/in/governance.use-cases';
import type { DeleteProjectDocumentUseCase } from '@application/ports/in/project-document.use-cases';
import type { DocumentTable } from '@infrastructure/adapters/out/persistence/postgres/postgres-document.repository';
import { requireEditor } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import {
  expectedVersionOf,
  readDocument,
  registerVersionsRoute,
  sendVersion,
} from '@infrastructure/adapters/in/http/document-version';
import { withDocumentScope } from '@infrastructure/concurrency/document-scope';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';

export type ProjectDocumentRouteOptions<Input, Dto> = {
  /** Segment d'URL sous /api/v1/projects/:projectId (ex. « risks », « charter »). */
  segment: string;
  get: { execute(query: { projectId: string }): Promise<Dto> };
} & (
  | {
      bodySchema: ZodType<Input>;
      save: { execute(command: { projectId: string; input: Input }): Promise<Dto> };
      /** Table du document : sa version circule en ETag / If-Match (concurrence optimiste). */
      table: DocumentTable;
      /** Suppression du document entier (documents rédigés ; un registre se vide entrée par entrée). */
      remove?: DeleteProjectDocumentUseCase;
    }
  /** Document calculé (ex. référence des coûts) : lecture seule. */
  | { bodySchema?: undefined; save?: undefined; table?: undefined; remove?: undefined }
);

/**
 * Adaptateur ENTRANT HTTP générique pour un document par projet :
 * lecture (membres du projet), historique des versions et, s'il est saisi, création / remplacement,
 * voire suppression (rédacteurs).
 */
export function projectDocumentRoutes<Input, Dto>(
  options: ProjectDocumentRouteOptions<Input, Dto>,
  versions: ListDocumentVersionsUseCase,
): FastifyPluginAsync {
  const path = `/api/v1/projects/:projectId/${options.segment}`;

  return async (app) => {
    app.get(path, async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      if (!options.table) return options.get.execute({ projectId });
      return readDocument(request, reply, options.table, versions, () => options.get.execute({ projectId }));
    });

    const { bodySchema, save, table } = options;
    if (!bodySchema || !save || !table) return;
    registerVersionsRoute(app, path, table, versions);

    app.put(path, { preHandler: requireEditor }, async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      const input = bodySchema.parse(request.body);
      const { result, version } = await withDocumentScope(table, expectedVersionOf(request), () =>
        save.execute({ projectId, input }),
      );
      sendVersion(reply, version);
      return reply.status(200).send(result);
    });

    const { remove } = options;
    if (!remove) return;

    app.delete(path, { preHandler: requireEditor }, async (request, reply) => {
      const { projectId } = getExecutiveReportParamsSchema.parse(request.params);
      await withDocumentScope(table, expectedVersionOf(request), () => remove.execute({ projectId }));
      return reply.status(204).send();
    });
  };
}
