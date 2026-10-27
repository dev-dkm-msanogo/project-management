import { AuthenticationError } from '@application/errors/application-errors';
import { toUserDto } from '@application/mappers/user-to-dto.mapper';
import type { GetCurrentUserUseCase } from '@application/ports/in/auth.use-cases';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { UserDto } from '@shared/index';

export class GetCurrentUserService implements GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user || !user.active) {
      throw new AuthenticationError('Session invalide.');
    }
    return toUserDto(user);
  }
}
