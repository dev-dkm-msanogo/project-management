import type { ProjectPlan } from '@domain/entities/project-plan';
import { inputToPlan } from '@application/mappers/input-to-plan.mapper';
import type {
  SaveProjectPlanCommand,
  SaveProjectPlanUseCase,
} from '@application/ports/in/save-project-plan.use-case';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ProjectPlanDto } from '@shared/index';

export class SaveProjectPlanService implements SaveProjectPlanUseCase {
  /** `beforeSave` : contrôle avant enregistrement, ex. entrées retirées encore citées ailleurs. */
  constructor(
    private readonly repository: ProjectPlanRepository,
    private readonly beforeSave: (projectId: string, plan: ProjectPlan) => Promise<void>,
    private readonly toDto: (plan: ProjectPlan) => Promise<ProjectPlanDto>,
  ) {}

  async execute(command: SaveProjectPlanCommand): Promise<ProjectPlanDto> {
    const plan = inputToPlan(command.projectId, command.input);
    await this.beforeSave(command.projectId, plan);
    await this.repository.save(plan);
    return this.toDto(plan);
  }
}
