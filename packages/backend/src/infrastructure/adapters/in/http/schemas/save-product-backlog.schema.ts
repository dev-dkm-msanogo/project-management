import { z } from 'zod';
import { entryCode, isoDate, lines, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) du carnet de produit. */

export const saveProductBacklogBodySchema = z.object({
  items: z
    .array(
      z.object({
        code: entryCode,
        type: z.enum(['EPIC', 'STORY', 'DEFECT', 'TECHNICAL']),
        title: requiredText(200, "Le titre de l'élément est requis."),
        description: text(2000),
        acceptanceCriteria: text(2000),
        priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']),
        points: z.number().int().min(0).max(21).nullable(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
        doneOn: isoDate.nullable(),
        iterationCode: entryCode.nullable(),
        epicCode: entryCode.nullable(),
        requirementCode: entryCode.nullable(),
        wbsCode: z.string().trim().max(40).nullable(),
        assigneeId: z.string().trim().max(100).nullable(),
        acceptedBy: z.object({ id: z.string().max(100).nullable(), name: z.string().max(200) }).nullable().default(null),
        refusal: z
          .object({ reason: z.string().trim().max(1000), by: z.string().max(200), on: isoDate })
          .nullable()
          .default(null),
      }),
    )
    .max(1000),
  iterations: z
    .array(
      z.object({
        code: entryCode,
        name: requiredText(120, "Le nom de l'itération est requis."),
        goal: text(1000),
        start: isoDate,
        end: isoDate,
        capacity: z.number().int().min(0).max(999).nullable(),
        review: text(3000),
        wentWell: text(3000),
        toImprove: text(3000),
        actions: lines,
      }),
    )
    .max(200),
});

export const backlogDecisionParamsSchema = z.object({
  projectId: z.string().trim().min(1).max(100),
  code: entryCode,
});

export const backlogDecisionBodySchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT']),
  comment: z.string().trim().max(1000).nullable().default(null),
});
