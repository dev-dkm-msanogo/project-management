import { z } from 'zod';
import { STAKEHOLDER_QUESTIONS, type StakeholderQuestionKey } from '@shared/index';
import { entryCode, isoDate, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : questionnaire d'identification et cartographie. */

export const saveStakeholderQuestionnaireBodySchema = z.object({
  preparedOn: isoDate,
  answers: z
    .object(
      Object.fromEntries(STAKEHOLDER_QUESTIONS.map(({ key }) => [key, text(2000)])) as Record<
        StakeholderQuestionKey,
        ReturnType<typeof text>
      >,
    )
    .strict(),
});

export const saveStakeholderMappingBodySchema = z.object({
  preparedOn: isoDate,
  entries: z
    .array(
      z.object({
        stakeholderCode: entryCode,
        urgency: z.boolean(),
        legitimacy: z.boolean(),
        direction: z.enum(['UPWARD', 'DOWNWARD', 'OUTWARD', 'SIDEWARD']),
      }),
    )
    .max(200),
});
