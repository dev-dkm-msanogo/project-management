import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ProjectRole } from '@domain/value-objects/project-role';
import { canAdminister, canEditContent, type Role } from '@domain/value-objects/role';
import type { ResolveSessionUseCase } from '@application/ports/in/admin.use-cases';
import { setRequestActor } from '@infrastructure/concurrency/request-context';

// Typage de la charge utile du JWT et de request.user (augmentation @fastify/jwt).
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: Role };
    /** `iat` : date d'émission du jeton (secondes), comparée aux révocations du compte. */
    user: { id: string; role: Role; iat?: number };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Rôle du compte sur le projet de la route (`null` hors des routes /projects/:projectId). */
    projectRole: ProjectRole | null;
  }
}

const AUTH_COOKIE = 'gdp_token';
const EIGHT_HOURS_IN_SECONDS = 60 * 60 * 8;

function isPublic(request: FastifyRequest): boolean {
  const path = request.url.split('?')[0];
  if (path === '/health') return true;
  if (
    request.method === 'POST' &&
    (path === '/api/v1/auth/login' || path === '/api/v1/auth/logout')
  ) {
    return true;
  }
  return false;
}

/** Routes accessibles avec un mot de passe provisoire : de quoi le remplacer, rien d'autre. */
function allowedWhilePasswordChangeRequired(request: FastifyRequest): boolean {
  const path = request.url.split('?')[0];
  return (
    (request.method === 'GET' && path === '/api/v1/auth/me') ||
    (request.method === 'POST' && path === '/api/v1/auth/password')
  );
}

/**
 * Enregistre cookie + JWT, et une garde globale : toute route (hors publiques) exige un JWT
 * valide porté par un cookie httpOnly, PUIS un compte actif dont les sessions n'ont pas été
 * révoquées. Le rôle appliqué est le rôle courant du compte (un changement vaut aussitôt).
 */
export async function registerAuth(
  app: FastifyInstance,
  secret: string,
  resolveSession: ResolveSessionUseCase,
): Promise<void> {
  await app.register(cookie);
  await app.register(jwt, {
    secret,
    cookie: { cookieName: AUTH_COOKIE, signed: false },
  });

  app.addHook('onRequest', async (request, reply) => {
    if (isPublic(request)) return;
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentification requise.',
      });
    }
    const session = await resolveSession.execute({ userId: request.user.id, issuedAt: request.user.iat });
    if (!session) {
      clearAuthCookie(reply);
      return reply.status(401).send({ error: 'Unauthorized', message: 'Session expirée ou révoquée.' });
    }
    request.user = { ...request.user, role: session.role };
    setRequestActor(request.user.id);
    if (session.mustChangePassword && !allowedWhilePasswordChangeRequired(request)) {
      return reply.status(403).send({
        error: 'PasswordChangeRequired',
        message: 'Choisissez un nouveau mot de passe avant de continuer.',
      });
    }
  });
}

/** Émet le cookie d'authentification (httpOnly, SameSite=Lax, Secure en production). */
export function setAuthCookie(reply: FastifyReply, token: string, isProduction: boolean): void {
  reply.setCookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: EIGHT_HOURS_IN_SECONDS,
  });
}

export function clearAuthCookie(reply: FastifyReply): void {
  reply.clearCookie(AUTH_COOKIE, { path: '/' });
}

/** Garde RBAC : autorise l'édition (EDITOR ou ADMIN). */
export async function requireEditor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!canEditContent(request.user.role)) {
    await reply.status(403).send({
      error: 'Forbidden',
      message: 'Droits insuffisants : édition non autorisée.',
    });
  }
}

/** Garde : réserve l'action au chef de projet du projet de la route (ou à un administrateur). */
export async function requireProjectManager(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.projectRole !== 'MANAGER') {
    await reply.status(403).send({
      error: 'Forbidden',
      message: 'Droits insuffisants : action réservée au chef de projet.',
    });
  }
}

/** Garde RBAC : réserve l'action aux administrateurs. */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!canAdminister(request.user.role)) {
    await reply.status(403).send({
      error: 'Forbidden',
      message: 'Droits insuffisants : action réservée aux administrateurs.',
    });
  }
}
