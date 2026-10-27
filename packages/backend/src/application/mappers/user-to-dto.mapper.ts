import type { User } from '@domain/entities/user';
import type { UserAdminDto, UserDto } from '@shared/index';

/** Expose l'utilisateur sans jamais divulguer le hash du mot de passe. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

/** Vue d'administration : état du compte et dernière connexion. */
export function toUserAdminDto(user: User): UserAdminDto {
  return { ...toUserDto(user), active: user.active, lastLoginAt: user.lastLoginAt?.toISOString() ?? null };
}
