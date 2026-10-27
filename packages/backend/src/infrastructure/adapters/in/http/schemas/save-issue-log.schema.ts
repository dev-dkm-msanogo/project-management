import { z } from 'zod';
import {
  entryCode,
  isoDate,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) du journal des problèmes. */

export const saveIssueLogBodySchema = z.object({
  issues: z
    .array(
      z.object({
        code: entryCode,
        type: z.enum(['RESOURCE', 'TECHNICAL', 'STAKEHOLDER', 'SCOPE', 'QUALITY', 'SCHEDULE', 'COST', 'EXTERNAL', 'PROCESS']),
        description: requiredText(1500, 'La description du problème est requise.'),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
        impact: text(500),
        ownerId: resourceId("Le responsable est requis : choisissez une ressource du référentiel."),
        raisedOn: isoDate,
        status: z.enum(['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED']),
        resolvedOn: isoDate.nullable(),
        resolution: text(1500),
        comments: text(1000),
        riskCode: entryCode.nullable(),
        changeCode: entryCode.nullable(),
      }),
    )
    .max(500),
});
