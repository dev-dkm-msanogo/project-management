import { z } from 'zod';
import { requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des requêtes d'administration (comptes, référentiel des ressources) et du mot de passe. */

const role = z.enum(['ADMIN', 'EDITOR', 'VIEWER']);
const email = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(200);
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,60}$/, 'Identifiant invalide.');

export const createUserBodySchema = z.object({
  email,
  name: requiredText(120, 'Le nom est requis.'),
  role,
});

export const updateUserBodySchema = createUserBodySchema.extend({ active: z.boolean() });

export const userParamsSchema = z.object({ userId: identifier });

export const resourceParamsSchema = z.object({ resourceId: identifier });

export const directoryResourceBodySchema = z.object({
  name: requiredText(120, 'Le nom de la ressource est requis.'),
  kind: z.enum(['INTERNAL', 'EXTERNAL']),
  jobTitle: text(120),
  department: text(120),
  email: email.nullable(),
  skills: z.array(z.string().trim().max(60)).max(20),
  userId: identifier.nullable(),
  active: z.boolean(),
});

/** La politique de mot de passe (longueur…) est vérifiée par le domaine. */
export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.').max(200),
  newPassword: z.string().max(200),
});
