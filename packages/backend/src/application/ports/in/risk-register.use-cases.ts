import type { RiskRegisterDto, RiskRegisterInput } from '@shared/index';

/** Port ENTRANT : obtenir le registre des risques d'un projet (vide s'il n'existe pas encore). */
export interface GetRiskRegisterUseCase {
  execute(query: { projectId: string }): Promise<RiskRegisterDto>;
}

export interface SaveRiskRegisterCommand {
  projectId: string;
  input: RiskRegisterInput;
}

/** Port ENTRANT : créer ou remplacer le registre des risques d'un projet. */
export interface SaveRiskRegisterUseCase {
  execute(command: SaveRiskRegisterCommand): Promise<RiskRegisterDto>;
}
