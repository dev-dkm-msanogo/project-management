import type { AssumptionLog } from '@domain/entities/assumption-log';
import { ProjectCharter } from '@domain/entities/project-charter';
import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { Money } from '@domain/value-objects/money';
import { toAssumptionEntryDto } from '@application/mappers/assumption-log.mappers';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import { toStakeholderDto } from '@application/mappers/stakeholder-register.mappers';
import type { ProjectCharterDto, ProjectCharterInput } from '@shared/index';

/** Traductions de la charte du projet : domaine ⇄ saisie ⇄ lecture. */

/** Domaine → saisie (forme de persistance). */
export function charterToInput(charter: ProjectCharter): ProjectCharterInput {
  const { projectId: _projectId, ...props } = charter.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    inScope: [...props.inScope],
    outOfScope: [...props.outOfScope],
    deliverables: [...props.deliverables],
    requirements: [...props.requirements],
    highLevelRisks: [...props.highLevelRisks],
    objectives: props.objectives.map((item) => ({ ...item })),
    milestones: props.milestones.map((item) => ({ name: item.name, targetDate: isoDate(item.targetDate) })),
    budget: { amount: props.budget.amount, currency: props.budget.currency },
    sponsor: { ...props.sponsor },
    projectManager: { resourceId: props.projectManager.resourceId, authority: { ...props.projectManager.authority } },
  };
}

/** Saisie → domaine (invariants revalidés). */
export function inputToCharter(projectId: string, input: ProjectCharterInput): ProjectCharter {
  return ProjectCharter.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    milestones: input.milestones.map((item) => ({ name: item.name, targetDate: parseIsoDate(item.targetDate) })),
    budget: Money.of(input.budget.amount, input.budget.currency),
  });
}

/** Domaine → lecture, avec les références vivantes tirées des registres. */
export function toProjectCharterDto(
  charter: ProjectCharter,
  stakeholders: StakeholderRegister,
  assumptions: AssumptionLog,
): ProjectCharterDto {
  return {
    projectId: charter.projectId,
    ...charterToInput(charter),
    references: {
      stakeholders: stakeholders.rankedByInfluence.map(toStakeholderDto),
      constraints: assumptions.constraints.map(toAssumptionEntryDto),
      assumptions: assumptions.currentAssumptions.map(toAssumptionEntryDto),
    },
    missingForSubmission: charter.missingForSubmission,
  };
}
