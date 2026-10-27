import { z } from 'zod';

/** Validation des paramètres de route (défense en profondeur côté adaptateur). */
export const getExecutiveReportParamsSchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1, "L'identifiant du projet est requis.")
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, "Identifiant de projet invalide."),
});

export type GetExecutiveReportParams = z.infer<typeof getExecutiveReportParamsSchema>;

/** Rapport d'un mois : /executive-reports/:period (AAAA-MM). */
export const executiveReportParamsSchema = getExecutiveReportParamsSchema.extend({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mois invalide : attendu AAAA-MM.'),
});
