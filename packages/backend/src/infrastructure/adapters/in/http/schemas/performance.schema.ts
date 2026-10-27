import { z } from 'zod';
import { entryCode, isoDate, optionalText, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des saisies du pilotage : avancement d'une tâche, dépenses réelles, date d'état. */

const wbs = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)*$/, 'Code WBS invalide (format attendu : 1, 1.2, 1.2.3).');

export const taskProgressParamsSchema = z.object({
  projectId: z.string().min(1).max(100),
  wbs,
});

export const taskProgressBodySchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETE']),
  percentComplete: z.number().int().min(0).max(100),
  actualStart: isoDate.nullable(),
  actualFinish: isoDate.nullable(),
  asOf: isoDate,
  note: optionalText(500),
});

const actualCost = z.object({
  code: entryCode,
  date: isoDate,
  wbsCode: wbs,
  nature: z.enum(['LABOR', 'PHYSICAL']),
  description: requiredText(300, 'Chaque dépense doit être décrite.'),
  supplier: text(120),
  reference: text(60),
  amount: z.number().int().positive().max(1e13),
});

export const saveActualCostsBodySchema = z.object({
  entries: z.array(actualCost).max(2000),
});

export const earnedValueQuerySchema = z.object({
  statusDate: isoDate.optional(),
});
