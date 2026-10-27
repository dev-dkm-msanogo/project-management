import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export interface ResourceRole {
  role: string;
  /** Titulaire : ressource du référentiel (identifiant). */
  holderId: string;
  responsibility: string;
  authority: string;
  reportsTo: string | null;
}

export const RESOURCE_PLAN_SECTIONS = [
  'staffAcquisition',
  'staffRelease',
  'training',
  'rewards',
  'teamDevelopment',
  'resourceAcquisition',
  'resourceManagement',
] as const;

type Sections = Record<(typeof RESOURCE_PLAN_SECTIONS)[number], string>;

export interface ResourceManagementPlanProps extends Sections {
  projectId: string;
  preparedOn: Date;
  roles: readonly ResourceRole[];
}

const key = (role: string) => role.trim().toLowerCase();

/**
 * Agrégat racine : le plan de gestion des ressources (template PMI). Les rôles forment
 * l'organigramme du projet : noms uniques, rattachement à un rôle existant, sans boucle.
 * L'équipe et les ressources physiques sont lues dans les besoins en ressources.
 */
export class ResourceManagementPlan {
  private constructor(readonly props: Readonly<ResourceManagementPlanProps>) {}

  static create(params: ResourceManagementPlanProps): ResourceManagementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de gestion des ressources invalide.');
    }

    const names = new Map<string, string>();
    const roles = params.roles.map((item, index) => {
      const role = requiredText(item.role, `Le rôle n° ${index + 1} doit être nommé.`);
      if (names.has(key(role))) {
        throw new DomainError(`Rôle en double : « ${role} ».`);
      }
      names.set(key(role), role);
      return {
        role,
        holderId: item.holderId.trim(),
        responsibility: item.responsibility.trim(),
        authority: item.authority.trim(),
        reportsTo: item.reportsTo?.trim() || null,
      };
    });

    // Rattachement : le rôle supérieur existe (orthographe du rôle conservée) et la chaîne remonte au sommet.
    const parents = new Map<string, string>();
    for (const item of roles) {
      if (item.reportsTo === null) continue;
      const parent = names.get(key(item.reportsTo));
      if (!parent) {
        throw new DomainError(`Le rôle « ${item.role} » est rattaché à « ${item.reportsTo} », qui n'existe pas.`);
      }
      item.reportsTo = parent;
      parents.set(key(item.role), key(parent));
    }
    for (const item of roles) {
      const seen = new Set<string>();
      for (let current: string | undefined = key(item.role); current; current = parents.get(current)) {
        if (seen.has(current)) {
          throw new DomainError(`Organigramme circulaire autour du rôle « ${item.role} ».`);
        }
        seen.add(current);
      }
    }

    const sections = Object.fromEntries(RESOURCE_PLAN_SECTIONS.map((name) => [name, params[name].trim()])) as Sections;
    return new ResourceManagementPlan(
      Object.freeze({ ...params, ...sections, preparedOn: new Date(params.preparedOn), roles }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
