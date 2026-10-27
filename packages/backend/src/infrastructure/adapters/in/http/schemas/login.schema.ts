import { z } from 'zod';

/** Validation du corps de requête de connexion. */
export const loginBodySchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide.").max(200),
  password: z.string().min(1, 'Mot de passe requis.').max(200),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
