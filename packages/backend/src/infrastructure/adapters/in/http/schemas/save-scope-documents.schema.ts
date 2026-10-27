import { z, type ZodType } from 'zod';
import {
  MANAGEMENT_PLAN_CATALOG,
  type ManagementPlanKind,
  type ManagementPlansInput,
} from '@shared/index';
import {
  entryCode,
  isoDate,
  lines,
  requiredText,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : plans de gestion, registre des exigences, énoncé du périmètre. */

const PLAN_KINDS = Object.keys(MANAGEMENT_PLAN_CATALOG) as ManagementPlanKind[];

/** Un plan : seules les sections de son template sont admises. */
const planSchema = (kind: ManagementPlanKind) => {
  const allowed = new Set(MANAGEMENT_PLAN_CATALOG[kind].sections.map((section) => section.key));
  return z.object({
    preparedOn: isoDate,
    sections: z.record(text(8000)).superRefine((sections, ctx) => {
      for (const key of Object.keys(sections).filter((key) => !allowed.has(key))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Section inconnue pour ce plan : ${key}.` });
      }
    }),
  });
};

export const saveManagementPlansBodySchema: ZodType<ManagementPlansInput> = z.object({
  plans: z.object(Object.fromEntries(PLAN_KINDS.map((kind) => [kind, planSchema(kind).optional()]))).strict(),
});

export const saveRequirementsRegisterBodySchema = z.object({
  requirements: z
    .array(
      z.object({
        code: entryCode,
        statement: requiredText(1000, "L'énoncé de l'exigence est requis."),
        source: text(200),
        category: z.enum(['BUSINESS', 'STAKEHOLDER', 'FUNCTIONAL', 'NON_FUNCTIONAL', 'TRANSITION', 'PROJECT']),
        priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']),
        acceptanceCriteria: text(2000),
        verification: text(500),
        phase: text(100),
        status: z.enum([
          'PROPOSED',
          'APPROVED',
          'IN_DESIGN',
          'IN_DEVELOPMENT',
          'IN_TEST',
          'VERIFIED',
          'DEFERRED',
          'REJECTED',
        ]),
        businessObjective: text(500),
        deliverable: text(200),
        validation: text(500),
        satisfies: z.array(entryCode).max(50),
      }),
    )
    .max(500),
});

export const saveScopeStatementBodySchema = z.object({
  preparedOn: isoDate,
  description: requiredText(4000, 'La description du périmètre est requise.'),
  deliverables: z.array(z.object({ name: text(200), description: text(2000) })).max(50),
  acceptanceCriteria: lines,
  exclusions: lines,
});
