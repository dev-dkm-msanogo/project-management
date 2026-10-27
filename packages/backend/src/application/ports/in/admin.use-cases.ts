import type { Role } from '@domain/value-objects/role';
import type {
  ChangePasswordInput,
  CreateUserInput,
  DirectoryResourceDto,
  DirectoryResourceInput,
  ResourceDirectoryDto,
  UpdateUserInput,
  UserAdminDto,
  UserCredentialsDto,
  UserDto,
} from '@shared/index';

/** Ports ENTRANTS de l'administration des comptes et du référentiel des ressources. */

/** Session vérifiée à chaque requête : compte actif, rôle courant, jeton non révoqué. */
export interface SessionUser {
  id: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface ResolveSessionUseCase {
  execute(query: { userId: string; issuedAt: number | undefined }): Promise<SessionUser | null>;
}

export interface ChangeOwnPasswordUseCase {
  execute(command: { userId: string; input: ChangePasswordInput }): Promise<UserDto>;
}

export interface UserAdministration {
  list(): Promise<UserAdminDto[]>;
  create(command: { input: CreateUserInput }): Promise<UserCredentialsDto>;
  update(command: { actorId: string; userId: string; input: UpdateUserInput }): Promise<UserAdminDto>;
  resetPassword(command: { actorId: string; userId: string }): Promise<UserCredentialsDto>;
}

export interface ResourceDirectoryAdministration {
  list(): Promise<ResourceDirectoryDto>;
  create(command: { input: DirectoryResourceInput }): Promise<DirectoryResourceDto>;
  update(command: { resourceId: string; input: DirectoryResourceInput }): Promise<DirectoryResourceDto>;
  delete(command: { resourceId: string }): Promise<void>;
}
