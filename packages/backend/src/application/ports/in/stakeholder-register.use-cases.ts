import type { StakeholderRegisterDto, StakeholderRegisterInput } from '@shared/index';

/** Port ENTRANT : obtenir le registre des parties prenantes (vide s'il n'existe pas encore). */
export interface GetStakeholderRegisterUseCase {
  execute(query: { projectId: string }): Promise<StakeholderRegisterDto>;
}

export interface SaveStakeholderRegisterCommand {
  projectId: string;
  input: StakeholderRegisterInput;
}

/** Port ENTRANT : créer ou remplacer le registre des parties prenantes. */
export interface SaveStakeholderRegisterUseCase {
  execute(command: SaveStakeholderRegisterCommand): Promise<StakeholderRegisterDto>;
}
