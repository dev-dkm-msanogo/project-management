/**
 * Contrats des ressources (PMBOK 8 : processus 8 et 13, alimentés par 35), alignés sur les
 * templates « Resource Requirements », « Resource Breakdown Structure », « Resource Basis of
 * Estimates », « Resource Management Plan » et « Team Charter ». Dates en ISO-8601.
 */

/** Catégories de la structure de découpage des ressources (RBS), dans l'ordre du template. */
export type ResourceCategory = 'PEOPLE' | 'EQUIPMENT' | 'MATERIALS' | 'SUPPLIES' | 'FACILITIES';

export interface ResourceRequirementInput {
  code: string;
  category: ResourceCategory;
  /** Sous-ensemble de la RBS (ex. « Architecture et technique ») ; « » : directement sous la catégorie. */
  group: string;
  name: string;
  /** Quantité ou allocation, ex. « 1 personne, 80 % », « 3 environnements ». */
  quantity: string;
  /** Niveau de compétence (personnes) ou qualité (ressources physiques). */
  grade: string;
  assumptions: string;
  comments: string;
}

/** Base des estimations des ressources (template « Resource Basis of Estimates »). */
export interface ResourceBasisNarrativeInput {
  approach: string;
  methods: string;
  sources: string;
  assumptions: string;
  constraints: string;
  rangeAndConfidence: string;
  risksAndReserves: string;
}

export interface ResourceRequirementsInput {
  requirements: ResourceRequirementInput[];
  narrative: ResourceBasisNarrativeInput;
}

export interface ResourceRequirementsDto extends ResourceRequirementsInput {
  projectId: string;
}

/** Rôle du projet : responsabilités, autorité et rattachement (organigramme). */
export interface ResourceRoleInput {
  role: string;
  /** Titulaire (personne ou équipe) : ressource du référentiel (identifiant). */
  holderId: string;
  responsibility: string;
  authority: string;
  /** Rôle auquel celui-ci est rattaché ; null pour le sommet de l'organigramme. */
  reportsTo: string | null;
}

export interface ResourceManagementPlanInput {
  preparedOn: string;
  roles: ResourceRoleInput[];
  staffAcquisition: string;
  staffRelease: string;
  training: string;
  rewards: string;
  teamDevelopment: string;
  resourceAcquisition: string;
  resourceManagement: string;
}

/** Équipe et ressources physiques, lues en direct dans les besoins en ressources (source unique). */
export interface ResourcePlanReferencesDto {
  team: ResourceRequirementInput[];
  physical: ResourceRequirementInput[];
}

export interface ResourceManagementPlanDto extends ResourceManagementPlanInput {
  projectId: string;
  references: ResourcePlanReferencesDto;
}

export interface TeamSignatureInput {
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  resourceId: string;
  role: string;
  signedOn: string | null;
}

export interface TeamCharterInput {
  preparedOn: string;
  values: string[];
  meetingGuidelines: string[];
  communicationGuidelines: string[];
  decisionMaking: string;
  conflictResolution: string;
  otherAgreements: string[];
  signatures: TeamSignatureInput[];
}

export interface TeamCharterDto extends TeamCharterInput {
  projectId: string;
}
