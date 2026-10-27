import { z } from 'zod';
import {
  entryCode,
  isoDate,
  requiredText,
  resourceId,
  scale,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';

/** Validation du corps de requête (PUT) du registre des modifications. */

const impact = z.object({
  direction: z.enum(['INCREASE', 'DECREASE', 'MODIFY']).nullable(),
  description: text(1500),
});

const assessment = z.object({
  assessedById: resourceId("L'évaluateur est requis : choisissez une ressource du référentiel."),
  assessedOn: isoDate,
  alternatives: z
    .array(
      z.object({
        name: requiredText(200, "Le nom de l'alternative est requis."),
        cost: text(200),
        schedule: text(200),
        pros: text(1000),
        cons: text(1000),
      }),
    )
    .min(1)
    .max(10),
  criteria: z
    .array(
      z.object({
        name: requiredText(120, 'Le nom du critère est requis.'),
        description: text(500),
        weight: z.number().int().min(1).max(100),
        ratings: z.array(scale).max(10),
      }),
    )
    .max(20),
  recommended: text(200).nullable(),
  recommendation: text(3000),
  implementationNotes: text(3000),
});

export const saveChangeLogBodySchema = z.object({
  requests: z
    .array(
      z.object({
        code: entryCode,
        title: requiredText(300, 'Le résumé de la modification est requis.'),
        requestor: requiredText(120, 'Le demandeur est requis.'),
        submittedOn: isoDate,
        categories: z
          .array(z.enum(['SCOPE', 'QUALITY', 'REQUIREMENTS', 'COST', 'SCHEDULE', 'DOCUMENTS']))
          .min(1, 'Choisissez au moins une catégorie.')
          .max(6),
        description: text(3000),
        justification: text(3000),
        impacts: z
          .object({ SCOPE: impact, QUALITY: impact, REQUIREMENTS: impact, COST: impact, SCHEDULE: impact })
          .strict(),
        stakeholderRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
        stakeholderImpact: text(1500),
        costImpact: z.number().int().min(-1e12).max(1e12),
        scheduleImpactDays: z.number().int().min(-1000).max(1000),
        affectedDocuments: text(1500),
        comments: text(3000),
        assessment: assessment.nullable(),
        status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'DECIDED', 'IMPLEMENTED', 'CLOSED']),
        disposition: z.enum(['APPROVED', 'DEFERRED', 'REJECTED']).nullable(),
        decidedOn: isoDate.nullable(),
        decidedBy: text(120),
        decisionRationale: text(3000),
      }),
    )
    .max(500),
});

/** Décision d'un valideur sur une demande. */
export const changeDecisionBodySchema = z.object({
  disposition: z.enum(['APPROVED', 'DEFERRED', 'REJECTED']),
  rationale: requiredText(3000, 'Motivez la décision.'),
});

export const changeDecisionParamsSchema = getExecutiveReportParamsSchema.extend({ code: entryCode });
