import type { RiskRegister } from '@domain/entities/risk-register';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Port SORTANT : persistance des registres des risques. */
export type RiskRegisterRepository = ProjectDocumentRepository<RiskRegister>;
