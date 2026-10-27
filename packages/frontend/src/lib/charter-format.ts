import type {
  ApprovalStatus,
  CharterObjectiveCategory,
  OverallRiskLevel,
  ProjectCharterDto,
  ProjectCharterInput,
  ProjectManagerAuthorityInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés, règles d'affichage et conversions de la charte du projet (template PMI). */

/** Statut de la charte dans le circuit de validation. */
export const CHARTER_STATUS_LABELS: Record<ApprovalStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  APPROVED: 'Approuvée',
};

export const OBJECTIVE_CATEGORY_LABELS: Record<CharterObjectiveCategory, string> = {
  SCOPE: 'Périmètre',
  SCHEDULE: 'Délai',
  COST: 'Coût',
  OTHER: 'Autre (qualité…)',
};

export const OVERALL_RISK_LABELS: Record<OverallRiskLevel, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
};

export const OVERALL_RISK_MODIFIERS: Record<OverallRiskLevel, 'green' | 'amber' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'red',
};

/** Rubriques d'autorité du chef de projet, dans l'ordre du template. */
export const AUTHORITY_LABELS: Record<keyof ProjectManagerAuthorityInput, string> = {
  staffing: 'Décisions de personnel',
  budget: 'Gestion du budget et des écarts',
  technical: 'Décisions techniques',
  conflictResolution: 'Résolution des conflits',
};

// Miroir UX de la règle du domaine (ProjectCharter.missingForSubmission) — le serveur reste l'autorité.
/** Rubriques manquantes pour soumettre la charte à validation (vide : complète). */
export function missingForSubmission(charter: ProjectCharterInput): string[] {
  const authority = Object.values(charter.projectManager.authority);
  return [
    !charter.description.trim() && 'la description de haut niveau',
    charter.objectives.length === 0 && 'un objectif',
    charter.deliverables.length === 0 && 'un livrable',
    charter.requirements.length === 0 && 'une exigence de haut niveau',
    charter.overallRiskLevel === null && 'le niveau de risque global',
    charter.milestones.length === 0 && 'un jalon',
    !charter.exitCriteria.trim() && 'des critères de clôture',
    authority.some((value) => !value.trim()) && "les quatre rubriques d'autorité du chef de projet",
    !charter.sponsor.authority.trim() && "l'autorité du sponsor",
  ].filter((item): item is string => Boolean(item));
}

export function charterDtoToInput(dto: ProjectCharterDto): ProjectCharterInput {
  const { projectId: _projectId, references: _references, missingForSubmission: _missing, ...input } = dto;
  return structuredClone(input);
}

/** Nouvelle charte en brouillon, datée du jour ; le rédacteur est proposé comme chef de projet. */
export function blankCharter(projectManagerId: string): ProjectCharterInput {
  return {
    preparedOn: todayIso(),
    customer: null,
    purpose: '',
    description: '',
    inScope: [],
    outOfScope: [],
    deliverables: [],
    requirements: [],
    overallRiskLevel: null,
    highLevelRisks: [],
    objectives: [],
    milestones: [],
    budget: { amount: 0, currency: 'XOF' },
    fundingSource: null,
    exitCriteria: '',
    sponsor: { resourceId: '', role: '', authority: '' },
    projectManager: {
      resourceId: projectManagerId,
      authority: { staffing: '', budget: '', technical: '', conflictResolution: '' },
    },
  };
}
