import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const RESOURCE_CATEGORIES = ['PEOPLE', 'EQUIPMENT', 'MATERIALS', 'SUPPLIES', 'FACILITIES'] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_NARRATIVE_KEYS = [
  'approach',
  'methods',
  'sources',
  'assumptions',
  'constraints',
  'rangeAndConfidence',
  'risksAndReserves',
] as const;

export type ResourceBasisNarrative = Record<(typeof RESOURCE_NARRATIVE_KEYS)[number], string>;

export interface ResourceRequirementProps {
  code: string;
  category: ResourceCategory;
  group: string;
  name: string;
  quantity: string;
  grade: string;
  assumptions: string;
  comments: string;
}

/** Besoin en ressource (template « Resource Requirements ») : personne ou ressource physique. */
export class ResourceRequirement {
  private constructor(readonly props: Readonly<ResourceRequirementProps>) {}

  static create(params: ResourceRequirementProps): ResourceRequirement {
    const code = entryCode(params.code, 'de ressource');
    if (!(RESOURCE_CATEGORIES as readonly string[]).includes(params.category)) {
      throw new DomainError(`Catégorie invalide pour la ressource ${code}.`);
    }
    return new ResourceRequirement(
      Object.freeze({
        code,
        category: params.category,
        group: params.group.trim(),
        name: requiredText(params.name, `La ressource ${code} doit être nommée.`),
        quantity: params.quantity.trim(),
        grade: params.grade.trim(),
        assumptions: params.assumptions.trim(),
        comments: params.comments.trim(),
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  get isPerson(): boolean {
    return this.props.category === 'PEOPLE';
  }
}

/**
 * Agrégat racine : les besoins en ressources d'un projet et leur base d'estimation. La
 * structure de découpage des ressources (RBS) s'en déduit (catégorie → sous-ensemble →
 * ressource). Registre vide : état valide.
 */
export class ResourceRequirements {
  private constructor(
    public readonly projectId: string,
    public readonly requirements: readonly ResourceRequirement[],
    public readonly narrative: Readonly<ResourceBasisNarrative>,
  ) {}

  static create(params: {
    projectId: string;
    requirements: readonly ResourceRequirement[];
    narrative: ResourceBasisNarrative;
  }): ResourceRequirements {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.requirements, 'de ressource');
    const narrative = Object.fromEntries(
      RESOURCE_NARRATIVE_KEYS.map((key) => [key, params.narrative[key].trim()]),
    ) as ResourceBasisNarrative;
    return new ResourceRequirements(params.projectId, [...params.requirements], Object.freeze(narrative));
  }

  static empty(projectId: string): ResourceRequirements {
    const narrative = Object.fromEntries(RESOURCE_NARRATIVE_KEYS.map((key) => [key, ''])) as ResourceBasisNarrative;
    return ResourceRequirements.create({ projectId, requirements: [], narrative });
  }

  /** Membres de l'équipe (ressources humaines). */
  get team(): readonly ResourceRequirement[] {
    return this.requirements.filter((item) => item.isPerson);
  }

  /** Ressources physiques : équipements, matériels, fournitures et services, locaux. */
  get physical(): readonly ResourceRequirement[] {
    return this.requirements.filter((item) => !item.isPerson);
  }
}
