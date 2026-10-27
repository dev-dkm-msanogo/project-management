import type { ProjectPlan } from '@domain/entities/project-plan';
import { PlanNotFoundError } from '@application/errors/application-errors';
import type {
  GetProjectPlanQuery,
  GetProjectPlanUseCase,
} from '@application/ports/in/get-project-plan.use-case';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ProjectPlanDto } from '@shared/index';

export class GetProjectPlanService implements GetProjectPlanUseCase {
  /** `toDto` : lecture enrichie (ressources affectées, avancement effectif). */
  constructor(
    private readonly repository: ProjectPlanRepository,
    private readonly toDto: (plan: ProjectPlan) => Promise<ProjectPlanDto>,
  ) {}

  async execute(query: GetProjectPlanQuery): Promise<ProjectPlanDto> {
    const plan = await this.repository.findByProjectId(query.projectId);
    if (!plan) {
      throw new PlanNotFoundError(query.projectId);
    }
    return this.toDto(plan);
  }
}
