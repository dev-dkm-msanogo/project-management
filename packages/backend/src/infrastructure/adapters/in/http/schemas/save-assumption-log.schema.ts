import { z } from 'zod';
import {
  entryCode,
  isoDate,
  optionalText,
  requiredText,
  resourceId,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête de sauvegarde du registre des hypothèses et contraintes (PUT). */

const entrySchema = z.object({
  code: entryCode,
  kind: z.enum(['ASSUMPTION', 'CONSTRAINT']),
  statement: requiredText(500, "L'énoncé est requis."),
  category: z.enum([
    'SCOPE',
    'SCHEDULE',
    'COST',
    'RESOURCES',
    'STAKEHOLDERS',
    'TECHNICAL',
    'QUALITY',
    'ORGANIZATIONAL',
    'EXTERNAL',
    'PROCUREMENT',
  ]),
  ownerId: resourceId("Le responsable est requis : choisissez une ressource du référentiel."),
  dueDate: isoDate.nullable(),
  actions: optionalText(2000),
  status: z.enum(['TO_VALIDATE', 'VALIDATED', 'INVALIDATED', 'ACTIVE', 'LIFTED']),
  comments: optionalText(2000),
  riskCode: entryCode.nullable(),
});

export const saveAssumptionLogBodySchema = z.object({
  entries: z.array(entrySchema).max(500),
});
