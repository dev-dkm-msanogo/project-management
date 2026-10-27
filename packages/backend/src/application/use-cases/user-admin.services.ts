import { User } from '@domain/entities/user';
import { DomainError } from '@domain/errors/domain-errors';
import { assertPasswordPolicy } from '@domain/value-objects/password-policy';
import { AuthenticationError, ConflictError, NotFoundError } from '@application/errors/application-errors';
import { toUserAdminDto, toUserDto } from '@application/mappers/user-to-dto.mapper';
import type {
  ChangeOwnPasswordUseCase,
  ResolveSessionUseCase,
  SessionUser,
  UserAdministration,
} from '@application/ports/in/admin.use-cases';
import type { IdGenerator } from '@application/ports/out/id-generator';
import type { PasswordGenerator } from '@application/ports/out/password-generator';
import type { PasswordHasher } from '@application/ports/out/password-hasher';
import type { UserRepository } from '@application/ports/out/user.repository';
import type {
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UserAdminDto,
  UserCredentialsDto,
  UserDto,
} from '@shared/index';

type Clock = () => Date;
const systemClock: Clock = () => new Date();

/**
 * Administration des comptes (réservée aux administrateurs). Garde-fous : on ne change ni son
 * propre rôle ni son propre statut, et il reste toujours au moins un administrateur actif.
 * Création et réinitialisation donnent un mot de passe provisoire, affiché une seule fois.
 */
export class UserAdministrationService implements UserAdministration {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly passwords: PasswordGenerator,
    private readonly ids: IdGenerator,
    private readonly now: Clock = systemClock,
  ) {}

  async list(): Promise<UserAdminDto[]> {
    const users = await this.users.list();
    return users.sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(toUserAdminDto);
  }

  async create(command: { input: CreateUserInput }): Promise<UserCredentialsDto> {
    const { input } = command;
    await this.assertEmailFree(input.email);
    const temporaryPassword = this.passwords.temporaryPassword();
    const user = User.create({
      id: this.ids.next('u'),
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await this.hasher.hash(temporaryPassword),
      mustChangePassword: true,
    });
    await this.users.save(user);
    return { user: toUserAdminDto(user), temporaryPassword };
  }

  async update(command: { actorId: string; userId: string; input: UpdateUserInput }): Promise<UserAdminDto> {
    const { actorId, userId, input } = command;
    const user = await this.find(userId);
    if (actorId === userId && (input.role !== user.role || !input.active)) {
      throw new DomainError(
        'Vous ne pouvez ni changer votre propre rôle ni désactiver votre compte : demandez-le à un autre administrateur.',
      );
    }
    await this.assertEmailFree(input.email, userId);
    const updated = user.updated(input, this.now());
    await this.assertAdminRemains(user, updated);
    await this.users.save(updated);
    return toUserAdminDto(updated);
  }

  async resetPassword(command: { actorId: string; userId: string }): Promise<UserCredentialsDto> {
    if (command.actorId === command.userId) {
      throw new DomainError('Pour votre propre compte, changez votre mot de passe depuis « Mon compte ».');
    }
    const user = await this.find(command.userId);
    if (!user.active) {
      throw new DomainError('Réactivez le compte avant de réinitialiser son mot de passe.');
    }
    const temporaryPassword = this.passwords.temporaryPassword();
    const updated = user.withPassword(await this.hasher.hash(temporaryPassword), { temporary: true, now: this.now() });
    await this.users.save(updated);
    return { user: toUserAdminDto(updated), temporaryPassword };
  }

  private async find(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError(`Utilisateur introuvable : "${userId}".`);
    }
    return user;
  }

  private async assertEmailFree(email: string, exceptUserId?: string): Promise<void> {
    const existing = await this.users.findByEmail(email.trim().toLowerCase());
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictError('Cette adresse e-mail est déjà utilisée par un autre compte.');
    }
  }

  /** Retirer le dernier administrateur actif bloquerait toute administration. */
  private async assertAdminRemains(before: User, after: User): Promise<void> {
    const losesAdmin = before.role === 'ADMIN' && before.active && (after.role !== 'ADMIN' || !after.active);
    if (!losesAdmin) return;
    const others = (await this.users.list()).filter(
      (user) => user.id !== before.id && user.role === 'ADMIN' && user.active,
    );
    if (others.length === 0) {
      throw new DomainError('Il doit rester au moins un administrateur actif.');
    }
  }
}

/**
 * Vérifie la session à chaque requête : compte existant et actif, jeton émis après la dernière
 * révocation (changement de mot de passe, désactivation). Le rôle lu est le rôle courant.
 */
export class ResolveSessionService implements ResolveSessionUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(query: { userId: string; issuedAt: number | undefined }): Promise<SessionUser | null> {
    const user = await this.users.findById(query.userId);
    if (!user || !user.acceptsSessionIssuedAt(query.issuedAt)) return null;
    return { id: user.id, role: user.role, mustChangePassword: user.mustChangePassword };
  }
}

/** Changement de son propre mot de passe ; les autres sessions du compte sont révoquées. */
export class ChangeOwnPasswordService implements ChangeOwnPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly now: Clock = systemClock,
  ) {}

  async execute(command: { userId: string; input: ChangePasswordInput }): Promise<UserDto> {
    const { input } = command;
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new AuthenticationError('Session invalide.');
    }
    // Erreur métier (422) et non 401 : une saisie erronée ne doit pas fermer la session.
    if (!(await this.hasher.verify(input.currentPassword, user.passwordHash))) {
      throw new DomainError('Mot de passe actuel incorrect.');
    }
    if (input.newPassword === input.currentPassword) {
      throw new DomainError("Le nouveau mot de passe doit être différent de l'actuel.");
    }
    assertPasswordPolicy(input.newPassword, { email: user.email });
    const updated = user.withPassword(await this.hasher.hash(input.newPassword), { temporary: false, now: this.now() });
    await this.users.save(updated);
    return toUserDto(updated);
  }
}
