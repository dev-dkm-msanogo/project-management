import { z } from 'zod';
import {
  entryCode,
  isoDate,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) du registre des leçons apprises. */

export const saveLessonsLearnedBodySchema = z.object({
  lessons: z
    .array(
      z.object({
        code: entryCode,
        category: z.enum([
          'INITIATION',
          'PLANNING',
          'REQUIREMENTS',
          'DESIGN',
          'BUILD',
          'TEST',
          'LAUNCH',
          'CLOSEOUT',
          'STAKEHOLDERS',
          'COMMUNICATION',
          'RESOURCES',
          'QUALITY',
          'RISK',
          'PROCUREMENT',
        ]),
        recordedOn: isoDate,
        trigger: requiredText(1000, 'La situation est requise.'),
        lesson: requiredText(500, 'La leçon est requise.'),
        details: text(2000),
        responsibleId: resourceId("Le porteur de la leçon est requis : choisissez une ressource du référentiel."),
        comments: text(1000),
      }),
    )
    .max(500),
  patterns: z
    .array(
      z.object({
        name: requiredText(200, 'Le nom de la pratique récurrente est requis.'),
        lessonCodes: z.array(entryCode).min(1, 'Rattachez au moins une leçon.').max(50),
      }),
    )
    .max(50),
  transferredOn: isoDate.nullable(),
});
