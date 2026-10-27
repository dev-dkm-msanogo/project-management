import type {
  ImpactDefinitionInput,
  QualityManagementPlanDto,
  QualityManagementPlanInput,
  RiskCategory,
  RiskManagementPlanDto,
  RiskManagementPlanInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';
import { RISK_CATEGORY_LABELS } from '@/lib/risk-format';

/** Libellés et conversions des plans de gestion de la qualité et des risques (templates PMI). */

// --- Qualité ---

type QualityTextKey = 'managementApproach' | 'controlApproach' | 'procedures';

export const QUALITY_TEXT_LABELS: Record<QualityTextKey, string> = {
  managementApproach: 'Démarche de management de la qualité',
  controlApproach: 'Démarche de contrôle de la qualité',
  procedures: 'Procédures qualité applicables',
};

export function blankQualityPlan(): QualityManagementPlanInput {
  return {
    preparedOn: todayIso(),
    standards: [],
    objectives: [],
    roles: [],
    deliverables: [],
    processes: [],
    managementApproach: '',
    controlApproach: '',
    procedures: '',
  };
}

export function qualityPlanDtoToInput(dto: QualityManagementPlanDto): QualityManagementPlanInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}

// --- Risques ---

export const RISK_CATEGORIES = Object.keys(RISK_CATEGORY_LABELS) as RiskCategory[];

type RiskTextKey = 'funding' | 'contingencyProtocols' | 'timing' | 'tolerances' | 'tracking';

export const RISK_PLAN_TEXT_LABELS: Record<RiskTextKey, string> = {
  funding: 'Financement de la gestion des risques',
  contingencyProtocols: "Règles d'utilisation de la réserve pour aléas",
  timing: 'Fréquence et calendrier',
  tolerances: 'Tolérances des parties prenantes',
  tracking: 'Suivi et audit des risques',
};

export const IMPACT_OBJECTIVE_LABELS: Record<keyof ImpactDefinitionInput, string> = {
  scope: 'Périmètre',
  quality: 'Qualité',
  time: 'Délai',
  cost: 'Coût',
};

/** Sous-catégories proposées à la création, à adapter au projet. */
const DEFAULT_BREAKDOWN: Record<RiskCategory, string[]> = {
  TECHNICAL: ['Exigences', 'Technologies', 'Intégration', 'Performance et qualité', 'Sécurité'],
  MANAGEMENT: ['Estimations', 'Planification', 'Communication', 'Pilotage et reporting'],
  ORGANIZATIONAL: ['Financement', 'Ressources', 'Parties prenantes', 'Priorités et dépendances'],
  EXTERNAL: ['Fournisseurs', 'Réglementation', 'Marché', 'Infrastructures'],
};

const DEFAULT_PROBABILITY_RANGES = ['< 10 %', '10 à 30 %', '30 à 50 %', '50 à 70 %', '> 70 %'];

export function blankRiskPlan(): RiskManagementPlanInput {
  return {
    preparedOn: todayIso(),
    strategy: '',
    methodology: '',
    roles: [],
    breakdown: structuredClone(DEFAULT_BREAKDOWN),
    funding: '',
    contingencyProtocols: '',
    timing: '',
    tolerances: '',
    tracking: '',
    probability: DEFAULT_PROBABILITY_RANGES.map((range) => ({ range, description: '' })),
    impact: DEFAULT_PROBABILITY_RANGES.map(() => ({ scope: '', quality: '', time: '', cost: '' })),
  };
}

export function riskPlanDtoToInput(dto: RiskManagementPlanDto): RiskManagementPlanInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}
