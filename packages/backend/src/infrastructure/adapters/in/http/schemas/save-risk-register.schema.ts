import { z } from 'zod';
import {
  entryCode,
  isoDate,
  optionalText,
  resourceId,
  scale,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête de sauvegarde du registre des risques (PUT). */

const riskEntrySchema = z.object({
  code: entryCode,
  title: z.string().trim().min(1, "L'intitulé du risque est requis.").max(200),
  description: optionalText(2000),
  type: z.enum(['THREAT', 'OPPORTUNITY']),
  category: z.enum(['TECHNICAL', 'MANAGEMENT', 'ORGANIZATIONAL', 'EXTERNAL']),
  probability: scale,
  impacts: z.object({ scope: scale, quality: scale, time: scale, cost: scale }),
  strategy: z
    .enum(['ESCALATE', 'AVOID', 'TRANSFER', 'MITIGATE', 'ACCEPT', 'EXPLOIT', 'SHARE', 'ENHANCE'])
    .nullable(),
  response: optionalText(2000),
  trigger: optionalText(500),
  ownerId: resourceId("Le propriétaire du risque est requis : choisissez une ressource du référentiel."),
  status: z.enum(['IDENTIFIED', 'ANALYZED', 'RESPONSE_PLANNED', 'RESPONSE_IN_PROGRESS', 'CLOSED']),
  trend: z.enum(['UP', 'DOWN', 'STABLE']),
  dueDate: isoDate.nullable(),
  lastReviewedOn: isoDate.nullable(),
  residualProbability: scale.nullable(),
  residualImpact: scale.nullable(),
  comments: optionalText(1000),
});

export const saveRiskRegisterBodySchema = z.object({
  risks: z.array(riskEntrySchema).max(500),
});
