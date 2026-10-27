import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/** Port SORTANT : persistance des registres des parties prenantes. */
export type StakeholderRegisterRepository = ProjectDocumentRepository<StakeholderRegister>;
