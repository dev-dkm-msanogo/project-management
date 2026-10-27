import { z } from 'zod';
import { APPROVAL_SUBJECTS } from '@shared/index';
import { getExecutiveReportParamsSchema } from '@infrastructure/adapters/in/http/schemas/report.schema';

/** Validation des requêtes du circuit de validation. */

const subject = z.enum(APPROVAL_SUBJECTS as [string, ...string[]]);

export const approvalActionParamsSchema = getExecutiveReportParamsSchema.extend({
  subject,
  action: z.enum(['submit', 'withdraw', 'approve', 'reject', 'revise']),
});

export const approvalActionBodySchema = z
  .object({
    comment: z.string().trim().max(2000).nullable().default(null),
    changeRequest: z.string().trim().max(30).nullable().default(null),
  })
  .default({ comment: null, changeRequest: null });

export const approvalSnapshotParamsSchema = getExecutiveReportParamsSchema.extend({
  subject,
  revision: z.coerce.number().int().min(1).max(1000),
});

export const projectApproversBodySchema = z.object({
  userIds: z.array(z.string().trim().min(1).max(100)).max(20),
});
