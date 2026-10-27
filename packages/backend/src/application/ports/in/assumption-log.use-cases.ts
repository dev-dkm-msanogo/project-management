import type { AssumptionLogDto, AssumptionLogInput } from '@shared/index';

/** Port ENTRANT : obtenir le registre des hypothèses et contraintes (vide s'il n'existe pas encore). */
export interface GetAssumptionLogUseCase {
  execute(query: { projectId: string }): Promise<AssumptionLogDto>;
}

export interface SaveAssumptionLogCommand {
  projectId: string;
  input: AssumptionLogInput;
}

/** Port ENTRANT : créer ou remplacer le registre des hypothèses et contraintes. */
export interface SaveAssumptionLogUseCase {
  execute(command: SaveAssumptionLogCommand): Promise<AssumptionLogDto>;
}
