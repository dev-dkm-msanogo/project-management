import type {
  ResourceBasisNarrativeInput,
  ResourceCategory,
  ResourceManagementPlanDto,
  ResourceManagementPlanInput,
  ResourceRequirementInput,
  ResourceRequirementsDto,
  ResourceRequirementsInput,
  ResourceRoleInput,
  TeamCharterDto,
  TeamCharterInput,
} from '@shared/index';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';

/** Libellés, structures dérivées et conversions des documents de ressources (templates PMI). */

/** Catégories de la RBS, dans l'ordre du template. */
export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  PEOPLE: 'Personnes',
  EQUIPMENT: 'Équipements et infrastructure',
  MATERIALS: 'Matériels et ressources numériques',
  SUPPLIES: 'Fournitures, services et logiciels',
  FACILITIES: 'Locaux et installations',
};

export const RESOURCE_NARRATIVE_LABELS: Record<keyof ResourceBasisNarrativeInput, string> = {
  approach: 'Démarche',
  methods: "Méthodes d'estimation",
  sources: "Sources d'information",
  assumptions: 'Hypothèses',
  constraints: 'Contraintes',
  rangeAndConfidence: 'Fourchette et confiance',
  risksAndReserves: 'Risques et réserves',
};

type PlanSectionKey = Exclude<keyof ResourceManagementPlanInput, 'preparedOn' | 'roles'>;

/** Rubriques rédigées du plan de gestion des ressources, avec leur aide de rédaction. */
export const RESOURCE_PLAN_SECTIONS: Record<PlanSectionKey, { label: string; hint: string }> = {
  staffAcquisition: { label: 'Acquisition du personnel', hint: 'Origine des membres, accord des responsables, prestataires.' },
  staffRelease: { label: 'Libération du personnel', hint: 'Quand et comment chacun quitte le projet, passation.' },
  training: { label: 'Besoins de formation', hint: "Formations de l'équipe et des utilisateurs." },
  rewards: { label: 'Reconnaissance et récompenses', hint: 'Comment les contributions sont reconnues.' },
  teamDevelopment: { label: "Développement de l'équipe", hint: 'Rituels, cohésion, organisation du travail.' },
  resourceAcquisition: { label: 'Acquisition des ressources physiques', hint: 'Contrats, marchés, achats.' },
  resourceManagement: { label: 'Gestion des ressources physiques', hint: 'Suivi, inventaire, transfert en fin de projet.' },
};

export const CATEGORY_ORDER = Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[];

export const byCategoryThenCode = (a: ResourceRequirementInput, b: ResourceRequirementInput): number =>
  CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.code.localeCompare(b.code, 'fr', { numeric: true });

export function blankResource(requirements: readonly ResourceRequirementInput[]): ResourceRequirementInput {
  return {
    code: nextCode(requirements, 'R'),
    category: 'PEOPLE',
    group: '',
    name: '',
    quantity: '',
    grade: '',
    assumptions: '',
    comments: '',
  };
}

export function resourceRequirementsDtoToInput(dto: ResourceRequirementsDto): ResourceRequirementsInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}

// --- Structure de découpage des ressources (RBS), déduite des besoins ---

export interface RbsNode {
  code: string;
  label: string;
  detail?: string;
  children: RbsNode[];
}

/**
 * RBS du template : catégorie → sous-ensemble → ressource, numérotée 1.1, 1.1.1, 1.1.1.1.
 * Une ressource sans sous-ensemble se range directement sous sa catégorie.
 */
export function buildRbs(requirements: readonly ResourceRequirementInput[]): RbsNode[] {
  const item = (code: string, requirement: ResourceRequirementInput): RbsNode => ({
    code,
    label: requirement.name,
    detail: [requirement.quantity, requirement.grade].filter(Boolean).join(' · '),
    children: [],
  });

  return CATEGORY_ORDER.flatMap((category, index) => {
    const members = requirements.filter((requirement) => requirement.category === category).sort(byCategoryThenCode);
    if (members.length === 0) return [];
    const code = `1.${index + 1}`;
    const groups = [...new Set(members.map((requirement) => requirement.group).filter(Boolean))];
    const grouped = groups.map((group, groupIndex) => ({
      code: `${code}.${groupIndex + 1}`,
      label: group,
      children: members
        .filter((requirement) => requirement.group === group)
        .map((requirement, itemIndex) => item(`${code}.${groupIndex + 1}.${itemIndex + 1}`, requirement)),
    }));
    const loose = members
      .filter((requirement) => !requirement.group)
      .map((requirement, itemIndex) => item(`${code}.${groups.length + itemIndex + 1}`, requirement));
    return [{ code, label: RESOURCE_CATEGORY_LABELS[category], children: [...grouped, ...loose] }];
  });
}

// --- Plan de gestion des ressources ---

export interface OrgNode {
  role: ResourceRoleInput;
  children: OrgNode[];
}

/** Organigramme : rôles sans rattachement au sommet, puis leurs subordonnés. */
export function buildOrgChart(roles: readonly ResourceRoleInput[]): OrgNode[] {
  const childrenOf = (parent: string | null): OrgNode[] =>
    roles
      .filter((role) => (role.reportsTo ?? null) === parent)
      .map((role) => ({ role, children: childrenOf(role.role) }));
  return childrenOf(null);
}

export function blankResourcePlan(): ResourceManagementPlanInput {
  return {
    preparedOn: todayIso(),
    roles: [
      { role: 'Sponsor', holderId: '', responsibility: '', authority: '', reportsTo: null },
      { role: 'Chef de projet', holderId: '', responsibility: '', authority: '', reportsTo: 'Sponsor' },
    ],
    staffAcquisition: '',
    staffRelease: '',
    training: '',
    rewards: '',
    teamDevelopment: '',
    resourceAcquisition: '',
    resourceManagement: '',
  };
}

export function resourcePlanDtoToInput(dto: ResourceManagementPlanDto): ResourceManagementPlanInput {
  const { projectId: _projectId, references: _references, ...input } = dto;
  return structuredClone(input);
}

// --- Charte de l'équipe ---

export function blankTeamCharter(): TeamCharterInput {
  return {
    preparedOn: todayIso(),
    values: [],
    meetingGuidelines: [],
    communicationGuidelines: [],
    decisionMaking: '',
    conflictResolution: '',
    otherAgreements: [],
    signatures: [],
  };
}

export function teamCharterDtoToInput(dto: TeamCharterDto): TeamCharterInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}
