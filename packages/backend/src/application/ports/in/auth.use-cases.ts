import type { UserDto } from '@shared/index';

export interface LoginCommand {
  email: string;
  password: string;
}

/** Port ENTRANT : authentifier un utilisateur par e-mail + mot de passe. */
export interface LoginUseCase {
  execute(command: LoginCommand): Promise<UserDto>;
}

/** Port ENTRANT : obtenir l'utilisateur courant par son identifiant. */
export interface GetCurrentUserUseCase {
  execute(userId: string): Promise<UserDto>;
}
