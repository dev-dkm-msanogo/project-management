import { CostBaseline } from '@domain/entities/cost-baseline';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import { FundingRequirements } from '@domain/entities/funding-requirements';
import type { FundingStrategy } from '@domain/entities/funding-strategy';
import { DocumentNotFoundError } from '@application/errors/application-errors';
import { toFundingRequirementsDto, toFundingStrategyDto } from '@application/mappers/funding.mappers';
import type { GetProjectDocumentUseCase } from '@application/ports/in/project-document.use-cases';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import { charterBudget } from '@application/use-cases/cost.services';
import type { FundingRequirementsDto, FundingStrategyDto } from '@shared/index';

/** Lecture de la stratégie de financement, avec le budget approuvé de la charte relu à chaque lecture. */
export function fundingStrategyReader(charters: ProjectCharterRepository) {
  return async (strategy: FundingStrategy): Promise<FundingStrategyDto> =>
    toFundingStrategyDto(strategy, await charterBudget(charters, strategy.projectId));
}

/**
 * Besoins de financement : tranches de la stratégie face à la référence des coûts (estimations
 * réparties selon l'échéancier). Calculés à chaque lecture ; introuvables tant que la stratégie ou
 * les estimations manquent.
 */
export class GetFundingRequirementsService implements GetProjectDocumentUseCase<FundingRequirementsDto> {
  constructor(
    private readonly strategies: ProjectDocumentRepository<FundingStrategy>,
    private readonly estimates: ProjectDocumentRepository<CostEstimates>,
    private readonly plans: ProjectPlanRepository,
  ) {}

  async execute(query: { projectId: string }): Promise<FundingRequirementsDto> {
    const [strategy, estimates, plan] = await Promise.all([
      this.strategies.findByProjectId(query.projectId),
      this.estimates.findByProjectId(query.projectId),
      this.plans.findByProjectId(query.projectId),
    ]);
    if (!strategy || !estimates) {
      throw new DocumentNotFoundError(
        `Besoins de financement du projet "${query.projectId}" : stratégie de financement et estimations des coûts requises.`,
      );
    }
    const schedule = (plan?.tasks ?? []).map((task) => ({ wbs: task.wbs.value, start: task.start, end: task.end }));
    return toFundingRequirementsDto(query.projectId, FundingRequirements.from(strategy, CostBaseline.from(estimates, schedule)));
  }
}
