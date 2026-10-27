import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

/** Rubriques rédigées de chaque composant, dans l'ordre du modèle. */
export const DEVELOPMENT_TEXT_KEYS = [
  'selection',
  'rationale',
  'cadence',
  'definitionOfReady',
  'definitionOfDone',
  'tooling',
  'releaseStrategy',
] as const;
export const CHANGE_KEYS = ['approach', 'board', 'process', 'thresholds', 'documentation', 'tools'] as const;
export const CONFIGURATION_KEYS = [
  'items',
  'identification',
  'versionControl',
  'changeLinkage',
  'statusAccounting',
  'audits',
  'roles',
] as const;

type Texts<K extends readonly string[]> = Record<K[number], string>;

/** Approche rédigée ; son type est la méthodologie du projet, portée par le projet. */
export type DevelopmentApproach = Texts<typeof DEVELOPMENT_TEXT_KEYS>;
export type ChangeManagement = Texts<typeof CHANGE_KEYS>;
export type ConfigurationManagement = Texts<typeof CONFIGURATION_KEYS>;

export interface LifeCyclePhase {
  name: string;
  period: string;
  description: string;
  gate: string;
}

export interface LifeCycle {
  overview: string;
  phases: readonly LifeCyclePhase[];
  gateReview: string;
}

export interface ProjectManagementPlanProps {
  projectId: string;
  preparedOn: Date;
  lifeCycle: LifeCycle;
  developmentApproach: DevelopmentApproach;
  changeManagement: ChangeManagement;
  configurationManagement: ConfigurationManagement;
}

/** Composants rédigés dans le plan lui-même (les autres sont lus dans leurs documents). */
export interface DraftedComponents {
  LIFE_CYCLE: boolean;
  DEVELOPMENT_APPROACH: boolean;
  CHANGE_MANAGEMENT: boolean;
  CONFIGURATION_MANAGEMENT: boolean;
}

const trimmed = <K extends string>(keys: readonly K[], texts: Record<K, string>): Record<K, string> =>
  Object.fromEntries(keys.map((key) => [key, texts[key].trim()])) as Record<K, string>;

const written = (texts: Record<string, string>): boolean => Object.values(texts).some((text) => text !== '');

/**
 * Agrégat racine : le plan de management du projet. Il intègre les plans subsidiaires et les
 * références de base (lus dans leurs documents) et porte ce que le modèle lui réserve : cycle
 * de vie, approche de développement, gestion des modifications et de la configuration.
 * Sa version et son approbation (avec ses plans et références) passent par le circuit de validation.
 */
export class ProjectManagementPlan {
  private constructor(readonly props: Readonly<ProjectManagementPlanProps>) {}

  static create(params: ProjectManagementPlanProps): ProjectManagementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de management invalide.');
    }
    const names = new Set<string>();
    const phases = params.lifeCycle.phases.map((phase, index) => {
      const name = requiredText(phase.name, `Nommez la phase n° ${index + 1} du cycle de vie.`);
      if (names.has(name.toLowerCase())) {
        throw new DomainError(`Phase en double dans le cycle de vie : « ${name} ».`);
      }
      names.add(name.toLowerCase());
      return { name, period: phase.period.trim(), description: phase.description.trim(), gate: phase.gate.trim() };
    });

    return new ProjectManagementPlan(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        lifeCycle: {
          overview: params.lifeCycle.overview.trim(),
          phases,
          gateReview: params.lifeCycle.gateReview.trim(),
        },
        developmentApproach: trimmed(DEVELOPMENT_TEXT_KEYS, params.developmentApproach),
        changeManagement: trimmed(CHANGE_KEYS, params.changeManagement),
        configurationManagement: trimmed(CONFIGURATION_KEYS, params.configurationManagement),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get drafted(): DraftedComponents {
    const { lifeCycle, developmentApproach, changeManagement, configurationManagement } = this.props;
    return {
      LIFE_CYCLE: lifeCycle.phases.length > 0 || lifeCycle.overview !== '',
      DEVELOPMENT_APPROACH: written(developmentApproach),
      CHANGE_MANAGEMENT: written(changeManagement),
      CONFIGURATION_MANAGEMENT: written(configurationManagement),
    };
  }
}
