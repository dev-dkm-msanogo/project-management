import { z } from 'zod';
import { isoDate, lines, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : plans de gestion de la qualité et des risques. */

const section = text(3000);
const roles = z
  .array(z.object({ role: requiredText(120, 'Le rôle est requis.'), responsibility: text(1000) }))
  .max(30);
/** Cinq niveaux, du plus faible (1) au plus fort (5). */
const fiveLevels = <T extends z.ZodTypeAny>(level: T) => z.array(level).length(5);

export const saveQualityPlanBodySchema = z.object({
  preparedOn: isoDate,
  standards: lines,
  objectives: z
    .array(
      z.object({
        objective: requiredText(300, "L'objectif qualité est requis."),
        measure: requiredText(500, "La mesure de l'objectif qualité est requise."),
      }),
    )
    .max(30),
  roles,
  deliverables: lines,
  processes: lines,
  managementApproach: section,
  controlApproach: section,
  procedures: section,
});

const subcategories = z.array(z.string().trim().max(120)).max(20);

export const saveRiskPlanBodySchema = z.object({
  preparedOn: isoDate,
  strategy: section,
  methodology: section,
  roles,
  breakdown: z
    .object({
      TECHNICAL: subcategories,
      MANAGEMENT: subcategories,
      ORGANIZATIONAL: subcategories,
      EXTERNAL: subcategories,
    })
    .strict(),
  funding: section,
  contingencyProtocols: section,
  timing: section,
  tolerances: section,
  tracking: section,
  probability: fiveLevels(z.object({ range: text(60), description: text(300) })),
  impact: fiveLevels(z.object({ scope: text(200), quality: text(200), time: text(200), cost: text(200) })),
});
