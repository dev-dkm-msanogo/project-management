import type { FastifyPluginAsync } from 'fastify';
import type { ChangeOwnPasswordUseCase } from '@application/ports/in/admin.use-cases';
import type {
  GetCurrentUserUseCase,
  LoginUseCase,
} from '@application/ports/in/auth.use-cases';
import {
  clearAuthCookie,
  setAuthCookie,
} from '@infrastructure/adapters/in/http/auth/auth-plugin';
import { changePasswordBodySchema } from '@infrastructure/adapters/in/http/schemas/admin.schema';
import { loginBodySchema } from '@infrastructure/adapters/in/http/schemas/login.schema';

export interface AuthRoutesDeps {
  login: LoginUseCase;
  getCurrentUser: GetCurrentUserUseCase;
  changeOwnPassword: ChangeOwnPasswordUseCase;
  isProduction: boolean;
  jwtExpiresIn: string;
}

/** Routes d'authentification : connexion, déconnexion, profil courant, changement de mot de passe. */
export function authRoutes(deps: AuthRoutesDeps): FastifyPluginAsync {
  return async (app) => {
    // Limitation stricte anti-force brute (OWASP) : 10 tentatives / 15 min par IP.
    const loginRateLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

    app.post('/api/v1/auth/login', { config: loginRateLimit }, async (request, reply) => {
      const { email, password } = loginBodySchema.parse(request.body);
      const user = await deps.login.execute({ email, password });
      const token = app.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: deps.jwtExpiresIn },
      );
      setAuthCookie(reply, token, deps.isProduction);
      return user;
    });

    app.post('/api/v1/auth/logout', async (_request, reply) => {
      clearAuthCookie(reply);
      return reply.status(204).send();
    });

    app.get('/api/v1/auth/me', async (request) => {
      return deps.getCurrentUser.execute(request.user.id);
    });

    // Changement de son mot de passe : les autres sessions sont révoquées, celle-ci est renouvelée.
    app.post('/api/v1/auth/password', { config: loginRateLimit }, async (request, reply) => {
      const input = changePasswordBodySchema.parse(request.body);
      const user = await deps.changeOwnPassword.execute({ userId: request.user.id, input });
      const token = app.jwt.sign({ id: user.id, role: user.role }, { expiresIn: deps.jwtExpiresIn });
      setAuthCookie(reply, token, deps.isProduction);
      return user;
    });
  };
}
