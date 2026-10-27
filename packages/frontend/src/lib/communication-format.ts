import type {
  CommunicationPlanDto,
  CommunicationPlanInput,
  CommunicationStyle,
  EngagementApproachInput,
  StakeholderDto,
  StakeholderEngagementPlanDto,
  StakeholderEngagementPlanInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et conversions du plan d'engagement et du plan de communication (templates PMI). */

export const STYLE_LABELS: Record<CommunicationStyle, string> = {
  PUSH: 'Diffusion',
  PULL: 'Mise à disposition',
  INTERACTIVE: 'Échange interactif',
};

export const STYLE_HINTS: Record<CommunicationStyle, string> = {
  PUSH: "L'information est envoyée (courriel, note, lettre d'information).",
  PULL: "L'information est consultable à la demande (site, espace partagé).",
  INTERACTIVE: 'Échange en direct (réunion, atelier, point).',
};

export const STYLES = Object.keys(STYLE_LABELS) as CommunicationStyle[];

/** Destinataires collectifs proposés en plus des parties prenantes du registre. */
export const GROUP_AUDIENCES = ['Toutes les parties prenantes', 'Équipe projet'] as const;

/** Approche initiale d'une partie prenante : sa stratégie du registre, à détailler. */
export function approachFor(stakeholder: StakeholderDto): EngagementApproachInput {
  return {
    stakeholderCode: stakeholder.code,
    approach: stakeholder.strategy ?? '',
    informationNeeds: '',
    frequency: '',
    method: '',
    styles: [],
  };
}

/**
 * Nouveau plan, prérempli depuis le registre (élaboration progressive) : une approche par
 * partie prenante, reprenant sa stratégie, de la plus à la moins influente.
 */
export function blankEngagementPlan(stakeholders: readonly StakeholderDto[]): StakeholderEngagementPlanInput {
  return {
    preparedOn: todayIso(),
    approaches: stakeholders.map(approachFor),
    pendingChanges: '',
    relationships: '',
  };
}

export function engagementPlanDtoToInput(dto: StakeholderEngagementPlanDto): StakeholderEngagementPlanInput {
  const { projectId: _projectId, stakeholders: _stakeholders, missingApproaches: _missing, ...input } = dto;
  return structuredClone(input);
}

export function blankCommunicationPlan(): CommunicationPlanInput {
  return { preparedOn: todayIso(), communications: [], assumptions: [], constraints: [], glossary: [] };
}

export function communicationPlanDtoToInput(dto: CommunicationPlanDto): CommunicationPlanInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}
