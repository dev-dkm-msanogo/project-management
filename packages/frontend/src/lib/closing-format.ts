import {
  TEAM_CRITERIA,
  type BenefitOutcome,
  type ClosureReportDto,
  type ClosureReportInput,
  type DeliverableStage,
  type TeamAssessmentInput,
  type TeamCriterion,
  type TeamDto,
  type TeamRating,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et formes de saisie des livrables, de l'équipe et du rapport de clôture. */

// --- Livrables ---

export const DELIVERABLE_STAGE_LABELS: Record<DeliverableStage, string> = {
  PLANNED: 'Prévu',
  IN_PROGRESS: 'En production',
  COMPLETED: 'À vérifier',
  VERIFIED: "En attente d'acceptation",
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
};

export const DELIVERABLE_STAGE_MODIFIERS: Record<DeliverableStage, 'grey' | 'blue' | 'amber' | 'green' | 'red'> = {
  PLANNED: 'grey',
  IN_PROGRESS: 'blue',
  COMPLETED: 'amber',
  VERIFIED: 'amber',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

// --- Équipe ---

export const TEAM_CRITERION_LABELS: Record<TeamCriterion, string> = {
  SCOPE: 'Périmètre',
  QUALITY: 'Qualité',
  SCHEDULE: 'Délais',
  COST: 'Coûts',
  COMMUNICATION: 'Communication',
  COLLABORATION: 'Collaboration',
  CONFLICT_MANAGEMENT: 'Gestion des conflits',
  DECISION_MAKING: 'Prise de décision',
  MORALE: "Moral de l'équipe",
};

/** Groupes du template : performance technique, puis compétences relationnelles. */
export const TEAM_CRITERION_GROUPS: { title: string; criteria: TeamCriterion[] }[] = [
  { title: 'Performance technique', criteria: ['SCOPE', 'QUALITY', 'SCHEDULE', 'COST'] },
  {
    title: 'Compétences relationnelles',
    criteria: ['COMMUNICATION', 'COLLABORATION', 'CONFLICT_MANAGEMENT', 'DECISION_MAKING', 'MORALE'],
  },
];

export const TEAM_RATING_LABELS: Record<TeamRating, string> = {
  EXCEEDS: 'Au-delà des attentes',
  MEETS: 'Conforme aux attentes',
  NEEDS_IMPROVEMENT: 'À améliorer',
};

export const TEAM_RATING_MODIFIERS: Record<TeamRating, 'green' | 'blue' | 'amber'> = {
  EXCEEDS: 'green',
  MEETS: 'blue',
  NEEDS_IMPROVEMENT: 'amber',
};

export function teamDtoToInput(dto: TeamDto): TeamAssessmentInput {
  return { assessedOn: dto.assessedOn, criteria: dto.criteria, developmentAreas: dto.developmentAreas };
}

/** Évaluation à rédiger : datée du jour, critères à noter. */
export function startedAssessment(input: TeamAssessmentInput): TeamAssessmentInput {
  return {
    ...input,
    assessedOn: input.assessedOn ?? todayIso(),
    criteria: Object.fromEntries(
      TEAM_CRITERIA.map((criterion) => [criterion, input.criteria[criterion] ?? { rating: null, comments: '' }]),
    ) as TeamAssessmentInput['criteria'],
  };
}

// --- Rapport de clôture ---

export const BENEFIT_OUTCOME_LABELS: Record<BenefitOutcome, string> = {
  MET: 'Atteint',
  MEASURING: 'En cours de mesure',
  NOT_MET: 'Non atteint',
};

export const BENEFIT_OUTCOME_MODIFIERS: Record<BenefitOutcome, 'green' | 'amber' | 'red'> = {
  MET: 'green',
  MEASURING: 'amber',
  NOT_MET: 'red',
};

export function closureReportDtoToInput(dto: ClosureReportDto): ClosureReportInput {
  const { projectId: _projectId, facts: _facts, ...input } = dto;
  return input;
}

/** Rapport à rédiger : rubriques du template, bénéfices repris du plan de gestion des bénéfices. */
export function blankClosureReport(plannedBenefits: readonly string[] = []): ClosureReportInput {
  return {
    preparedOn: todayIso(),
    description: '',
    objectives: [
      { objective: 'Périmètre', criteria: '', howMet: '' },
      { objective: 'Qualité', criteria: '', howMet: '' },
    ],
    scheduleComments: '',
    costComments: '',
    benefits: plannedBenefits.map((need) => ({ need, outcome: 'MEASURING', comments: '' })),
    riskAndIssueDisposition: '',
    product: '',
    recipients: [],
    training: '',
    supportArrangements: '',
    outstandingItems: [],
    acceptances: [],
  };
}
