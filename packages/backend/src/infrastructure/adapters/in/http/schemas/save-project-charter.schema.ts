import { z } from 'zod';
import {
  isoDate,
  optionalText,
  requiredText,
  resourceId,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête de sauvegarde de la charte du projet (PUT). */

const lines = z.array(z.string().trim().max(500)).max(50);
const text = (max: number) => z.string().trim().max(max);

export const saveProjectCharterBodySchema = z.object({
  preparedOn: isoDate,
  customer: optionalText(200),
  purpose: requiredText(4000, "L'objet du projet est requis."),
  description: text(4000),
  inScope: lines,
  outOfScope: lines,
  deliverables: lines,
  requirements: lines,
  overallRiskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
  highLevelRisks: lines,
  objectives: z
    .array(
      z.object({
        category: z.enum(['SCOPE', 'SCHEDULE', 'COST', 'OTHER']),
        objective: text(500),
        successCriterion: text(500),
      }),
    )
    .max(20),
  milestones: z.array(z.object({ name: text(200), targetDate: isoDate })).max(30),
  budget: z.object({
    amount: z.number().finite().min(0),
    currency: z.string().regex(/^[A-Za-z]{3}$/),
  }),
  fundingSource: optionalText(500),
  exitCriteria: text(2000),
  sponsor: z.object({
    resourceId: resourceId("Le sponsor est requis : choisissez une ressource du référentiel."),
    role: text(120),
    authority: text(2000),
  }),
  projectManager: z.object({
    resourceId: resourceId("Le chef de projet est requis : choisissez une ressource du référentiel."),
    authority: z.object({
      staffing: text(2000),
      budget: text(2000),
      technical: text(2000),
      conflictResolution: text(2000),
    }),
  }),
});
