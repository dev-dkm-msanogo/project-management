import { DomainError } from '@domain/errors/domain-errors';
import type { Money } from '@domain/value-objects/money';
import { assertProjectId, optionalText, requiredText } from '@domain/value-objects/register-rules';

export const OBJECTIVE_CATEGORIES = ['SCOPE', 'SCHEDULE', 'COST', 'OTHER'] as const;
export type ObjectiveCategory = (typeof OBJECTIVE_CATEGORIES)[number];

export const OVERALL_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type OverallRiskLevel = (typeof OVERALL_RISK_LEVELS)[number];

export interface CharterObjective {
  category: ObjectiveCategory;
  objective: string;
  successCriterion: string;
}

export interface CharterMilestone {
  name: string;
  targetDate: Date;
}

/** Niveau d'autorité du chef de projet, par domaine de décision (template PMI). */
export interface ProjectManagerAuthority {
  staffing: string;
  budget: string;
  technical: string;
  conflictResolution: string;
}

export interface ProjectCharterProps {
  projectId: string;
  preparedOn: Date;
  customer: string | null;
  purpose: string;
  description: string;
  inScope: readonly string[];
  outOfScope: readonly string[];
  deliverables: readonly string[];
  requirements: readonly string[];
  overallRiskLevel: OverallRiskLevel | null;
  highLevelRisks: readonly string[];
  objectives: readonly CharterObjective[];
  milestones: readonly CharterMilestone[];
  budget: Money;
  fundingSource: string | null;
  exitCriteria: string;
  /** Sponsor et chef de projet : ressources du référentiel (identifiants). */
  sponsor: { resourceId: string; role: string; authority: string };
  projectManager: { resourceId: string; authority: ProjectManagerAuthority };
}

/** Lignes non vides et sans espaces superflus. */
function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function validDate(date: Date, label: string): Date {
  if (Number.isNaN(date.getTime())) {
    throw new DomainError(`Date invalide : ${label}.`);
  }
  return new Date(date);
}

/**
 * Agrégat racine : la charte du projet (processus 1). Elle autorise formellement le
 * projet, nomme le chef de projet et fixe les autorités. Sa soumission (signature du chef de
 * projet) et son approbation (sponsor) passent par le circuit de validation.
 */
export class ProjectCharter {
  private constructor(readonly props: Readonly<ProjectCharterProps>) {}

  static create(params: ProjectCharterProps): ProjectCharter {
    assertProjectId(params.projectId);
    if (params.overallRiskLevel !== null && !(OVERALL_RISK_LEVELS as readonly string[]).includes(params.overallRiskLevel)) {
      throw new DomainError(`Niveau de risque global invalide : "${params.overallRiskLevel}".`);
    }
    if (params.budget.amount < 0) {
      throw new DomainError('Le budget pré-approuvé ne peut pas être négatif.');
    }

    const objectives = params.objectives.map((item, index) => {
      if (!(OBJECTIVE_CATEGORIES as readonly string[]).includes(item.category)) {
        throw new DomainError(`Rubrique invalide pour l'objectif n° ${index + 1}.`);
      }
      return {
        category: item.category,
        objective: requiredText(item.objective, `L'objectif n° ${index + 1} est vide.`),
        successCriterion: requiredText(
          item.successCriterion,
          `L'objectif n° ${index + 1} doit avoir un critère de succès mesurable.`,
        ),
      };
    });
    const milestones = params.milestones.map((item, index) => ({
      name: requiredText(item.name, `Le jalon n° ${index + 1} doit avoir un nom.`),
      targetDate: validDate(item.targetDate, `jalon n° ${index + 1}`),
    }));
    const authority = params.projectManager.authority;

    const charter: ProjectCharterProps = {
      ...params,
      preparedOn: validDate(params.preparedOn, 'date de préparation'),
      customer: optionalText(params.customer),
      purpose: requiredText(params.purpose, "L'objet du projet est requis."),
      description: params.description.trim(),
      inScope: lines(params.inScope),
      outOfScope: lines(params.outOfScope),
      deliverables: lines(params.deliverables),
      requirements: lines(params.requirements),
      highLevelRisks: lines(params.highLevelRisks),
      objectives,
      milestones,
      fundingSource: optionalText(params.fundingSource),
      exitCriteria: params.exitCriteria.trim(),
      sponsor: {
        resourceId: requiredText(params.sponsor.resourceId, 'Choisissez le sponsor dans le référentiel des ressources.'),
        role: params.sponsor.role.trim(),
        authority: params.sponsor.authority.trim(),
      },
      projectManager: {
        resourceId: requiredText(params.projectManager.resourceId, 'Choisissez le chef de projet dans le référentiel des ressources.'),
        authority: {
          staffing: authority.staffing.trim(),
          budget: authority.budget.trim(),
          technical: authority.technical.trim(),
          conflictResolution: authority.conflictResolution.trim(),
        },
      },
    };

    return new ProjectCharter(Object.freeze(charter));
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /**
   * Rubriques du template encore à compléter pour soumettre la charte à validation.
   * Un brouillon peut rester incomplet ; le circuit de validation refuse de le soumettre.
   */
  get missingForSubmission(): string[] {
    const p = this.props;
    const authority = Object.values(p.projectManager.authority);
    return [
      !p.description && 'la description de haut niveau',
      p.objectives.length === 0 && 'un objectif',
      p.deliverables.length === 0 && 'un livrable',
      p.requirements.length === 0 && 'une exigence de haut niveau',
      p.overallRiskLevel === null && 'le niveau de risque global',
      p.milestones.length === 0 && 'un jalon',
      !p.exitCriteria && 'des critères de clôture',
      authority.some((value) => !value) && "les quatre rubriques d'autorité du chef de projet",
      !p.sponsor.authority && "l'autorité du sponsor",
    ].filter((item): item is string => Boolean(item));
  }
}
