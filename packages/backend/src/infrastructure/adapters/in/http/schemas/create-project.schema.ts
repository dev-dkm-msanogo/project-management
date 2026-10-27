import { z } from 'zod';

/** Validation du corps de requête de création ou de modification d'un projet. */
export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1, 'Le nom du projet est requis.').max(120),
  description: z.string().trim().max(500).nullable(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']),
  methodology: z.enum(['PREDICTIVE', 'HYBRID', 'ADAPTIVE']).default('PREDICTIVE'),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

/** Équipe d'un projet : comptes et rôles (le domaine exige un chef de projet). */
export const projectTeamBodySchema = z.object({
  members: z
    .array(z.object({ userId: z.string().trim().min(1).max(100), role: z.enum(['MANAGER', 'CONTRIBUTOR', 'READER']) }))
    .max(200),
});
