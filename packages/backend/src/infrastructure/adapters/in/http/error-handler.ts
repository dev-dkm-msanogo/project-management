import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import {
  ApplicationError,
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
} from '@application/errors/application-errors';
import { DomainError } from '@domain/errors/domain-errors';

/**
 * Gestionnaire d'erreurs centralisé : traduit les erreurs métier/application
 * en réponses HTTP sûres, sans fuite de détails techniques sur les 5xx.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Requête invalide.',
        details: error.issues,
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: 'NotFound', message: error.message });
    }

    if (error instanceof InvalidCredentialsError || error instanceof AuthenticationError) {
      return reply.status(401).send({ error: 'Unauthorized', message: error.message });
    }

    if (error instanceof ForbiddenError) {
      return reply.status(403).send({ error: 'Forbidden', message: error.message });
    }

    if (error instanceof ConflictError) {
      return reply.status(409).send({ error: 'Conflict', message: error.message });
    }

    if (error instanceof DomainError) {
      return reply.status(422).send({ error: 'DomainError', message: error.message });
    }

    if (error instanceof ApplicationError) {
      return reply.status(400).send({ error: 'ApplicationError', message: error.message });
    }

    // Erreurs émises par les plugins Fastify (ex. rate-limit 429, body trop grand).
    const fastifyError = error as FastifyError;
    const statusCode = fastifyError.statusCode ?? 500;
    if (statusCode < 500) {
      return reply.status(statusCode).send({
        error: fastifyError.name || 'Error',
        message: fastifyError.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'InternalServerError',
      message: 'Une erreur interne est survenue.',
    });
  });
}
