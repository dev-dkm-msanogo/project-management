import type { ProjectCharter } from '@domain/entities/project-charter';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Port SORTANT : persistance des chartes de projet. */
export type ProjectCharterRepository = ProjectDocumentRepository<ProjectCharter>;
