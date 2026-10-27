import { z } from 'zod';
import {
  isoDate,
  lines,
  optionalText,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : business case, plan des bénéfices, matrice RACI. */

export const saveBusinessCaseBodySchema = z.object({
  preparedOn: isoDate,
  businessNeed: requiredText(4000, 'Le besoin métier est requis.'),
  strategicAlignment: text(4000),
  situation: lines,
  alternatives: z
    .array(
      z.object({
        option: text(200),
        description: text(1000),
        cost: text(200),
        outcome: z.enum(['SELECTED', 'REJECTED']),
        rationale: text(1000),
      }),
    )
    .max(10),
  recommendedSolution: text(4000),
  financialLines: z
    .array(
      z.object({
        label: text(200),
        kind: z.enum(['COST', 'BENEFIT']),
        amounts: z.array(z.number().finite().min(0)).length(3),
      }),
    )
    .max(30),
  financialNote: optionalText(1000),
  keyRisks: lines,
  recommendation: text(4000),
});

export const saveBenefitsPlanBodySchema = z.object({
  preparedOn: isoDate,
  summary: text(2000),
  targetBenefits: lines,
  strategicAlignment: text(4000),
  benefits: z
    .array(
      z.object({
        name: text(200),
        realizedFrom: text(200),
        sustainedThrough: text(200),
        metrics: z
          .array(z.object({ metric: text(500), baseline: text(200), target: text(200), ownerId: resourceId("Le responsable de l'indicateur est requis : choisissez une ressource du référentiel.") }))
          .max(10),
      }),
    )
    .max(20),
  assumptions: lines,
  risks: lines,
  governance: text(4000),
});

export const saveResponsibilityMatrixBodySchema = z.object({
  preparedOn: isoDate,
  participants: z
    .array(
      z.object({
        key: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Identifiant de participant invalide.'),
        resourceId: resourceId("Le participant est requis : choisissez une ressource du référentiel."),
        role: text(120),
      }),
    )
    .max(30),
  activities: z
    .array(z.object({ name: text(200), assignments: z.record(z.enum(['R', 'A', 'C', 'I'])) }))
    .max(100),
});
