import type { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';
import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { DomainError } from '@domain/errors/domain-errors';
import { toEngagementPlanDto } from '@application/mappers/communication.mappers';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { StakeholderEngagementPlanDto } from '@shared/index';

/**
 * Plan d'engagement : le registre des parties prenantes reste la source des niveaux
 * d'engagement (relu à chaque lecture) et de l'identité des parties prenantes visées.
 */
export function engagementPlanServices(stakeholders: StakeholderRegisterRepository) {
  const register = (projectId: string) => loadOrEmpty(stakeholders, projectId, StakeholderRegister.empty);

  return {
    toDto: async (plan: StakeholderEngagementPlan): Promise<StakeholderEngagementPlanDto> =>
      toEngagementPlanDto(plan, await register(plan.projectId)),

    /** Intégrité référentielle : chaque approche vise une partie prenante du registre. */
    beforeSave: async (plan: StakeholderEngagementPlan): Promise<void> => {
      const unknown = plan.unknownStakeholders(await register(plan.projectId));
      if (unknown.length > 0) {
        throw new DomainError(`Partie(s) prenante(s) absente(s) du registre : ${unknown.join(', ')}.`);
      }
    },
  };
}
