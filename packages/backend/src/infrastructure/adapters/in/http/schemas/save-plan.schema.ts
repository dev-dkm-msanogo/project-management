import { z } from 'zod';

/** Validation du corps de requête de sauvegarde d'un plan (PUT). */

const nonEmpty = z.string().trim().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');
const taskStatus = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETE']);
const wbs = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)*$/, 'Code WBS invalide (format attendu : 1, 1.2, 1.2.3).');

const taskSchema = z.object({
  wbs,
  name: nonEmpty,
  status: taskStatus,
  assigneeId: z.string().trim().max(64).nullable().default(null),
  start: isoDate.nullable(),
  end: isoDate.nullable(),
  comments: z.string().nullable(),
});

export const savePlanBodySchema = z.object({
  title: nonEmpty,
  managerId: z.string().trim().max(100).nullable(),
  tasks: z.array(taskSchema).min(1),
});

export type SavePlanBody = z.infer<typeof savePlanBodySchema>;
