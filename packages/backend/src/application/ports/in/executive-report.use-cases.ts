import type {
  ExecutiveReportSummaryDto,
  ExecutiveStatusReportDto,
  ExecutiveStatusReportInput,
} from '@shared/index';

/** Ports ENTRANTS du rapport exécutif : un rapport par mois, figé à sa publication. */

export interface ListExecutiveReportsUseCase {
  execute(query: { projectId: string }): Promise<ExecutiveReportSummaryDto[]>;
}

export interface GetExecutiveReportUseCase {
  execute(query: { projectId: string; period: string }): Promise<ExecutiveStatusReportDto>;
}

export interface SaveExecutiveReportUseCase {
  execute(command: { projectId: string; period: string; input: ExecutiveStatusReportInput }): Promise<ExecutiveStatusReportDto>;
}

export interface PublishExecutiveReportUseCase {
  execute(command: { projectId: string; period: string; actorId: string }): Promise<ExecutiveStatusReportDto>;
}

export interface DeleteExecutiveReportUseCase {
  execute(command: { projectId: string; period: string }): Promise<void>;
}
