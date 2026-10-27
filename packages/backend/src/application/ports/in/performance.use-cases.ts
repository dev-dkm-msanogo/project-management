import type { Role } from '@domain/value-objects/role';
import type { Requester } from '@application/ports/in/project.use-cases';
import type { EarnedValueDto, MyTasksDto, PortfolioDto, TaskProgressDto, TaskProgressInput } from '@shared/index';

/** Ports ENTRANTS du pilotage du réel. */

export interface UpdateTaskProgressUseCase {
  execute(command: {
    projectId: string;
    wbs: string;
    input: TaskProgressInput;
    actor: { id: string; role: Role };
  }): Promise<TaskProgressDto>;
}

export interface GetMyTasksUseCase {
  execute(query: { requester: Requester }): Promise<MyTasksDto>;
}

export interface GetEarnedValueUseCase {
  execute(query: { projectId: string; statusDate?: string }): Promise<EarnedValueDto>;
}

export interface GetPortfolioUseCase {
  execute(query: { requester: Requester }): Promise<PortfolioDto>;
}
