import { StakeholderMapping, hasPower, salienceCategory } from '@domain/entities/stakeholder-mapping';
import { StakeholderQuestionnaire } from '@domain/entities/stakeholder-questionnaire';
import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import { toStakeholderDto } from '@application/mappers/stakeholder-register.mappers';
import type {
  StakeholderMappingDto,
  StakeholderMappingInput,
  StakeholderQuestionnaireDto,
  StakeholderQuestionnaireInput,
} from '@shared/index';

/** Traductions du questionnaire d'identification et de la cartographie : domaine ⇄ saisie ⇄ lecture. */

// --- Questionnaire d'identification ---

export function questionnaireToInput(questionnaire: StakeholderQuestionnaire): StakeholderQuestionnaireInput {
  return { preparedOn: isoDate(questionnaire.props.preparedOn), answers: { ...questionnaire.props.answers } };
}

export function inputToQuestionnaire(projectId: string, input: StakeholderQuestionnaireInput): StakeholderQuestionnaire {
  return StakeholderQuestionnaire.create({ projectId, preparedOn: parseIsoDate(input.preparedOn), answers: input.answers });
}

export function toQuestionnaireDto(questionnaire: StakeholderQuestionnaire): StakeholderQuestionnaireDto {
  return { projectId: questionnaire.projectId, ...questionnaireToInput(questionnaire) };
}

// --- Cartographie ---

export function mappingToInput(mapping: StakeholderMapping): StakeholderMappingInput {
  return {
    preparedOn: isoDate(mapping.props.preparedOn),
    entries: mapping.props.entries.map((entry) => ({ ...entry })),
  };
}

export function inputToMapping(projectId: string, input: StakeholderMappingInput): StakeholderMapping {
  return StakeholderMapping.create({ projectId, preparedOn: parseIsoDate(input.preparedOn), entries: input.entries });
}

/** Domaine → lecture : identité, pouvoir et catégorie de saillance relus dans le registre. */
export function toMappingDto(mapping: StakeholderMapping, register: StakeholderRegister): StakeholderMappingDto {
  const byCode = new Map(register.stakeholders.map((stakeholder) => [stakeholder.code.toUpperCase(), stakeholder]));
  return {
    projectId: mapping.projectId,
    preparedOn: isoDate(mapping.props.preparedOn),
    entries: mapping.props.entries.map((entry) => {
      const stakeholder = byCode.get(entry.stakeholderCode.toUpperCase());
      return {
        ...entry,
        name: stakeholder?.props.name ?? entry.stakeholderCode,
        role: stakeholder?.props.role ?? '',
        power: hasPower(stakeholder),
        category: salienceCategory(entry, stakeholder),
      };
    }),
    stakeholders: register.rankedByInfluence.map(toStakeholderDto),
    unmapped: mapping.unmapped(register),
  };
}
