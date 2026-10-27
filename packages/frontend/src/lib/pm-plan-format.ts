import type {
  ChangeManagementInput,
  ConfigurationManagementInput,
  DevelopmentApproachInput,
  PlanComponentKey,
  ProjectManagementPlanDto,
  ProjectManagementPlanInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

/** Libellés, composants et conversions du plan de management du projet. */

export type PlanTab = 'overview' | 'baselines' | 'life-cycle' | 'approach' | 'change' | 'configuration';

type DevelopmentTextKey = keyof DevelopmentApproachInput;

export const DEVELOPMENT_TEXT_LABELS: Record<DevelopmentTextKey, string> = {
  selection: "Choix de l'approche",
  rationale: 'Justification',
  cadence: 'Cadence et rituels',
  definitionOfReady: 'Définition de « prêt »',
  definitionOfDone: 'Définition de « terminé »',
  tooling: 'Outillage',
  releaseStrategy: 'Qualité et mise en production',
};

export const CHANGE_LABELS: Record<keyof ChangeManagementInput, string> = {
  approach: 'Démarche de contrôle des modifications',
  board: 'Comité de contrôle des modifications',
  process: "Traitement d'une demande",
  thresholds: "Seuils d'approbation",
  documentation: 'Traçabilité et communication',
  tools: 'Outils et modèles',
};

export const CONFIGURATION_LABELS: Record<keyof ConfigurationManagementInput, string> = {
  items: 'Éléments de configuration',
  identification: 'Identification et nommage',
  versionControl: 'Gestion des versions',
  changeLinkage: 'Lien avec la gestion des modifications',
  statusAccounting: 'Suivi de la configuration',
  audits: 'Audits de configuration',
  roles: 'Rôles et responsabilités',
};

/**
 * Composant du plan : page qui le porte (`view`), onglet du plan (`tab`), ou ni l'un ni
 * l'autre s'il n'est pas encore outillé. `key` : composant dont l'état est connu.
 */
export interface PlanComponent {
  label: string;
  key?: PlanComponentKey;
  view?: AppView;
  tab?: PlanTab;
}

/** Groupe de composants, avec le libellé de chaque état (rédigé ou établi, sinon à faire). */
export interface PlanComponentGroup {
  title: string;
  done: string;
  todo: string;
  items: readonly PlanComponent[];
}

export const PLAN_COMPONENT_GROUPS: readonly PlanComponentGroup[] = [
  {
    title: 'Plans de gestion',
    done: 'Rédigé',
    todo: 'À rédiger',
    items: [
      { label: 'Plan de gestion du périmètre', key: 'SCOPE_MANAGEMENT', view: 'scope-plan' },
      { label: 'Plan de gestion des exigences', key: 'REQUIREMENTS_MANAGEMENT', view: 'requirements-plan' },
      { label: "Plan de gestion de l'échéancier", key: 'SCHEDULE_MANAGEMENT', view: 'schedule-plan' },
      { label: 'Plan de gestion financière', key: 'FINANCIAL_MANAGEMENT', view: 'financial-plan' },
      { label: 'Plan de gestion de la qualité', key: 'QUALITY_MANAGEMENT', view: 'quality-plan' },
      { label: 'Plan de gestion des ressources', key: 'RESOURCE_MANAGEMENT', view: 'resource-plan' },
      { label: 'Plan de communication', key: 'COMMUNICATIONS_MANAGEMENT', view: 'communication-plan' },
      { label: 'Plan de gestion des risques', key: 'RISK_MANAGEMENT', view: 'risk-plan' },
      { label: 'Plan de gestion des approvisionnements', key: 'PROCUREMENT_MANAGEMENT', view: 'procurement-plan' },
      { label: "Plan d'engagement des parties prenantes", key: 'STAKEHOLDER_ENGAGEMENT', view: 'engagement-plan' },
      { label: 'Plan de gestion des modifications', key: 'CHANGE_MANAGEMENT', tab: 'change' },
      { label: 'Plan de gestion de la configuration', key: 'CONFIGURATION_MANAGEMENT', tab: 'configuration' },
    ],
  },
  {
    title: 'Références de base',
    done: 'Établie',
    todo: 'À établir',
    items: [
      { label: 'Référence du périmètre', key: 'SCOPE_BASELINE', view: 'scope-statement' },
      { label: "Référence de l'échéancier", key: 'SCHEDULE_BASELINE', view: 'schedule-baseline' },
      { label: 'Référence des coûts', key: 'COST_BASELINE', view: 'cost-baseline' },
      { label: 'Référence de mesure de la performance', key: 'PERFORMANCE_BASELINE', tab: 'baselines' },
    ],
  },
  {
    title: 'Cycle de vie et approche',
    done: 'Rédigé',
    todo: 'À rédiger',
    items: [
      { label: 'Description du cycle de vie', key: 'LIFE_CYCLE', tab: 'life-cycle' },
      { label: 'Approche de développement', key: 'DEVELOPMENT_APPROACH', tab: 'approach' },
    ],
  },
];

const blankTexts = <K extends string>(labels: Record<K, string>): Record<K, string> =>
  Object.fromEntries(Object.keys(labels).map((key) => [key, ''])) as Record<K, string>;

export function blankProjectManagementPlan(): ProjectManagementPlanInput {
  return {
    preparedOn: todayIso(),
    lifeCycle: { overview: '', phases: [], gateReview: '' },
    developmentApproach: blankTexts(DEVELOPMENT_TEXT_LABELS),
    changeManagement: blankTexts(CHANGE_LABELS),
    configurationManagement: blankTexts(CONFIGURATION_LABELS),
  };
}

export function projectManagementPlanDtoToInput(dto: ProjectManagementPlanDto): ProjectManagementPlanInput {
  const { projectId: _projectId, references: _references, components: _components, baselines: _baselines, ...input } = dto;
  // Le type d'approche est la méthodologie du projet : il ne se saisit pas dans le plan.
  const { kind: _kind, ...developmentApproach } = input.developmentApproach;
  return structuredClone({ ...input, developmentApproach });
}
