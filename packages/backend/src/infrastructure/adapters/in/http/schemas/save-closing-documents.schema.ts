import { z } from 'zod';
import {
  entryCode,
  isoDate,
  lines,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) des livrables, de l'évaluation de l'équipe et du rapport de clôture. */

export const saveDeliverablesBodySchema = z.object({
  records: z
    .array(
      z.object({
        wbsCode: requiredText(40, "L'élément de la WBS du livrable est requis."),
        verification: z
          .object({
            verifiedOn: isoDate,
            verifiedById: resourceId('Le vérificateur est requis : choisissez une ressource du référentiel.'),
            notes: text(1500),
          })
          .nullable(),
        acceptance: z
          .object({
            decision: z.enum(['ACCEPTED', 'REJECTED']),
            decidedOn: isoDate,
            decidedById: resourceId('Le décideur est requis : choisissez une ressource du référentiel.'),
            comments: text(1500),
            changeCode: entryCode.nullable(),
          })
          .nullable(),
      }),
    )
    .max(500),
});

const criterion = z.object({
  rating: z.enum(['EXCEEDS', 'MEETS', 'NEEDS_IMPROVEMENT']).nullable(),
  comments: text(1500),
});

export const saveTeamAssessmentBodySchema = z.object({
  assessedOn: isoDate.nullable(),
  criteria: z.object({
    SCOPE: criterion,
    QUALITY: criterion,
    SCHEDULE: criterion,
    COST: criterion,
    COMMUNICATION: criterion,
    COLLABORATION: criterion,
    CONFLICT_MANAGEMENT: criterion,
    DECISION_MAKING: criterion,
    MORALE: criterion,
  }),
  developmentAreas: z
    .array(
      z.object({
        area: requiredText(200, "L'axe de progression doit être nommé."),
        approach: text(1500),
        actions: lines,
      }),
    )
    .max(30),
});

export const saveClosureReportBodySchema = z.object({
  preparedOn: isoDate,
  description: text(3000),
  objectives: z
    .array(
      z.object({
        objective: requiredText(200, "L'objectif doit être nommé."),
        criteria: text(1500),
        howMet: text(1500),
      }),
    )
    .max(30),
  scheduleComments: text(1500),
  costComments: text(1500),
  benefits: z
    .array(
      z.object({
        need: requiredText(300, 'Le besoin ou le bénéfice doit être nommé.'),
        outcome: z.enum(['MET', 'MEASURING', 'NOT_MET']),
        comments: text(1500),
      }),
    )
    .max(30),
  riskAndIssueDisposition: text(3000),
  product: text(3000),
  recipients: z
    .array(
      z.object({
        recipient: requiredText(200, 'Le destinataire doit être nommé.'),
        responsibility: text(1000),
        materials: text(1000),
      }),
    )
    .max(30),
  training: text(3000),
  supportArrangements: text(3000),
  outstandingItems: lines,
  acceptances: z
    .array(
      z.object({
        resourceId: resourceId("La personne qui accepte est requise : choisissez une ressource du référentiel."),
        role: text(200),
        acceptedOn: isoDate.nullable(),
      }),
    )
    .max(30),
});
