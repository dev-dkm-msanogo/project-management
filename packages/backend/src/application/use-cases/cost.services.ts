import { CostBaseline } from '@domain/entities/cost-baseline';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import { DocumentNotFoundError } from '@application/errors/application-errors';
import { toCostBaselineDto, toCostEstimatesDto } from '@application/mappers/cost-estimates.mappers';
import type { GetProjectDocumentUseCase } from '@application/ports/in/project-document.use-cases';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { CostBaselineDto, CostEstimatesDto } from '@shared/index';

/** Budget pré-approuvé de la charte, référence des estimations (null sans charte). */
export async function charterBudget(charters: ProjectCharterRepository, projectId: string): Promise<number | null> {
  return (await charters.findByProjectId(projectId))?.props.budget.amount ?? null;
}

/** Lecture des estimations des coûts, avec le budget de la charte relu à chaque lecture. */
export function costEstimatesReader(charters: ProjectCharterRepository) {
  return async (estimates: CostEstimates): Promise<CostEstimatesDto> =>
    toCostEstimatesDto(estimates, await charterBudget(charters, estimates.projectId));
}

/**
 * Référence des coûts : les estimations réparties dans le temps selon l'échéancier du
 * plan de projet. Calculée à chaque lecture (estimations et échéancier en sources uniques) ;
 * introuvable tant qu'aucune estimation n'a été saisie.
 */
export class GetCostBaselineService implements GetProjectDocumentUseCase<CostBaselineDto> {
  constructor(
    private readonly estimates: ProjectDocumentRepository<CostEstimates>,
    private readonly plans: ProjectPlanRepository,
    private readonly charters: ProjectCharterRepository,
  ) {}

  async execute(query: { projectId: string }): Promise<CostBaselineDto> {
    const [estimates, plan, budget] = await Promise.all([
      this.estimates.findByProjectId(query.projectId),
      this.plans.findByProjectId(query.projectId),
      charterBudget(this.charters, query.projectId),
    ]);
    if (!estimates) {
      throw new DocumentNotFoundError(`Aucune estimation des coûts pour le projet "${query.projectId}".`);
    }
    const schedule = (plan?.tasks ?? []).map((task) => ({ wbs: task.wbs.value, start: task.start, end: task.end }));
    return toCostBaselineDto(query.projectId, CostBaseline.from(estimates, schedule), budget);
  }
}
