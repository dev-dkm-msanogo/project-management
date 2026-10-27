import type { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import { ResourceRequirements } from '@domain/entities/resource-requirements';
import { toResourcePlanDto } from '@application/mappers/resources.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ResourceManagementPlanDto } from '@shared/index';

/**
 * Lecture du plan de gestion des ressources : l'équipe et les ressources physiques
 * proviennent des besoins en ressources (source unique), relus à chaque lecture.
 */
export function resourcePlanReader(requirements: ProjectDocumentRepository<ResourceRequirements>) {
  return async (plan: ResourceManagementPlan): Promise<ResourceManagementPlanDto> =>
    toResourcePlanDto(plan, await loadOrEmpty(requirements, plan.projectId, ResourceRequirements.empty));
}
