import type {
  ContractType,
  ProcurementIntegrationInput,
  ProcurementPlanDto,
  ProcurementPlanInput,
  ProcurementStrategyDto,
  ProcurementStrategyInput,
  SourceSelectionInput,
  SourceSelectionsDto,
  SourceSelectionsInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et conversions des documents d'approvisionnement (templates PMI). */

// --- Plan de gestion des approvisionnements ---

export const INTEGRATION_LABELS: Record<keyof ProcurementIntegrationInput, string> = {
  scope: 'Périmètre',
  schedule: 'Échéancier',
  documentation: 'Documentation',
  risk: 'Risques',
  reporting: "Rapports d'avancement",
};

type PlanTextKey = 'jurisdiction' | 'independentEstimates' | 'riskManagement';

export const PLAN_TEXT_LABELS: Record<PlanTextKey, string> = {
  jurisdiction: 'Juridiction et devise',
  independentEstimates: 'Estimations indépendantes',
  riskManagement: 'Gestion des risques fournisseurs',
};

export function blankProcurementPlan(): ProcurementPlanInput {
  return {
    preparedOn: todayIso(),
    integration: { scope: '', schedule: '', documentation: '', risk: '', reporting: '' },
    activities: [],
    metrics: [],
    roles: [],
    jurisdiction: '',
    independentEstimates: '',
    riskManagement: '',
    sellers: [],
  };
}

export function procurementPlanDtoToInput(dto: ProcurementPlanDto): ProcurementPlanInput {
  const { projectId: _projectId, references: _references, ...input } = dto;
  return structuredClone(input);
}

// --- Stratégie d'approvisionnement ---

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FFP: 'Prix ferme',
  FPIF: 'Prix fixe avec intéressement',
  FP_EPA: 'Prix fixe avec révision de prix',
  CPFF: 'Coûts remboursés + honoraires fixes',
  CPIF: 'Coûts remboursés + intéressement',
  CPAF: 'Coûts remboursés + prime',
  TM: 'Régie (temps et matériaux)',
  OTHER: 'Autre',
};

/** Sigle affiché (forme usuelle) ; aucun pour « Autre ». */
export const CONTRACT_TYPE_CODES: Record<ContractType, string> = {
  FFP: 'FFP',
  FPIF: 'FPIF',
  FP_EPA: 'FP-EPA',
  CPFF: 'CPFF',
  CPIF: 'CPIF',
  CPAF: 'CPAF',
  TM: 'T&M',
  OTHER: '',
};

/** Libellé complet d'un type de contrat : sigle · intitulé. */
export const contractTypeLabel = (type: ContractType) =>
  [CONTRACT_TYPE_CODES[type], CONTRACT_TYPE_LABELS[type]].filter(Boolean).join(' · ');

/** Qui porte le risque de dépassement de coût, selon la famille de contrat. */
export const CONTRACT_RISK: Record<ContractType, { label: string; modifier: 'seller' | 'shared' | 'buyer' | 'other' }> = {
  FFP: { label: 'Risque porté par le fournisseur', modifier: 'seller' },
  FPIF: { label: 'Risque porté par le fournisseur', modifier: 'seller' },
  FP_EPA: { label: 'Risque porté par le fournisseur', modifier: 'seller' },
  CPFF: { label: "Risque porté par l'acheteur", modifier: 'buyer' },
  CPIF: { label: 'Risque partagé', modifier: 'shared' },
  CPAF: { label: "Risque porté par l'acheteur", modifier: 'buyer' },
  TM: { label: 'Risque partagé', modifier: 'shared' },
  OTHER: { label: 'À préciser', modifier: 'other' },
};

export const CONTRACT_TYPES = Object.keys(CONTRACT_TYPE_LABELS) as ContractType[];

type StrategyTextKey = 'deliveryMethod' | 'makeOrBuy' | 'incentiveCriteria' | 'knowledgeTransfer';

export const STRATEGY_TEXT_LABELS: Record<StrategyTextKey, string> = {
  deliveryMethod: 'Méthode de livraison',
  makeOrBuy: 'Faire ou acheter',
  incentiveCriteria: 'Intéressement et pénalités',
  knowledgeTransfer: 'Transfert de connaissances',
};

/** Cycle d'achat proposé à la création, à adapter. */
export const DEFAULT_PHASES = ['Planifier', 'Solliciter', 'Évaluer', 'Attribuer', 'Gérer', 'Clore'] as const;

export function blankProcurementStrategy(): ProcurementStrategyInput {
  return {
    preparedOn: todayIso(),
    deliveryMethod: '',
    makeOrBuy: '',
    contractTypes: [],
    incentiveCriteria: '',
    lifecycle: DEFAULT_PHASES.map((phase) => ({ phase, entryCriteria: '', deliverables: '', exitCriteria: '' })),
    knowledgeTransfer: '',
  };
}

export function procurementStrategyDtoToInput(dto: ProcurementStrategyDto): ProcurementStrategyInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}

// --- Sélection des fournisseurs ---

/** Nouvelle grille : deux candidats et des critères usuels déjà pondérés à 100 %. */
export function blankSelection(): SourceSelectionInput {
  const criterion = (name: string, weight: number) => ({ name, description: '', weight, ratings: [3, 3] });
  return {
    procurement: '',
    preparedOn: todayIso(),
    candidates: ['', ''],
    criteria: [criterion('Capacité technique', 40), criterion('Coût', 30), criterion('Délai', 15), criterion('Références', 15)],
    recommendation: '',
    award: null,
  };
}

export function sourceSelectionsDtoToInput(dto: SourceSelectionsDto): SourceSelectionsInput {
  return { evaluations: dto.evaluations.map(({ result: _result, ...evaluation }) => structuredClone(evaluation)) };
}
