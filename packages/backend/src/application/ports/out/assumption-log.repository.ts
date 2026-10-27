import type { AssumptionLog } from '@domain/entities/assumption-log';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Port SORTANT : persistance des registres des hypothèses et contraintes. */
export type AssumptionLogRepository = ProjectDocumentRepository<AssumptionLog>;
