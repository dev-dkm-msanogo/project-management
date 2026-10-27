import { InvalidCredentialsError } from '@application/errors/application-errors';
import { toUserDto } from '@application/mappers/user-to-dto.mapper';
import type { LoginCommand, LoginUseCase } from '@application/ports/in/auth.use-cases';
import type { PasswordHasher } from '@application/ports/out/password-hasher';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { UserDto } from '@shared/index';

/**
 * Authentifie un utilisateur. Message d'erreur générique dans tous les cas
 * (utilisateur inconnu ou désactivé, mot de passe faux) pour éviter l'énumération.
 * Une connexion réussie est horodatée (dernière connexion).
 */
export class LoginService implements LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(command: LoginCommand): Promise<UserDto> {
    const user = await this.users.findByEmail(command.email.trim().toLowerCase());
    // Compte désactivé : même message qu'un identifiant inconnu (anti-énumération).
    if (!user || !user.active) {
      throw new InvalidCredentialsError();
    }
    const valid = await this.hasher.verify(command.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }
    const loggedIn = user.loggedIn(this.now());
    await this.users.save(loggedIn);
    return toUserDto(loggedIn);
  }
}
