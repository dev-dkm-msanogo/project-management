import { z } from 'zod';
import {
  entryCode,
  isoDate,
  optionalResourceId,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) des estimations des coûts. */

const amount = z.number().finite().min(0).max(1e13);

const basisSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('PARAMETRIC'), costVariable: text(200), unitCost: amount, units: amount }),
  z.object({
    method: z.literal('ANALOGOUS'),
    previousActivity: text(200),
    previousCost: amount,
    multiplier: z.number().finite().positive().max(1000),
  }),
  z.object({ method: z.literal('THREE_POINT'), optimistic: amount, mostLikely: amount, pessimistic: amount }),
  z.object({
    method: z.literal('BOTTOM_UP'),
    laborHours: amount,
    laborRate: amount,
    material: amount,
    supplies: amount,
    equipment: amount,
    travel: amount,
    otherDirect: amount,
    indirect: amount,
    reserve: amount,
  }),
]);

export const saveCostEstimatesBodySchema = z.object({
  preparedOn: isoDate,
  activities: z
    .array(
      z.object({
        code: entryCode,
        wbsCode: z.string().trim().max(30),
        name: requiredText(200, "Le nom de l'activité est requis."),
        resourceId: optionalResourceId,
        laborCost: amount,
        physicalCost: amount,
        physicalCostNote: text(300),
        method: z.enum(['ANALOGOUS', 'PARAMETRIC', 'THREE_POINT', 'BOTTOM_UP']),
        rangePct: z.number().finite().min(0).max(100),
        confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        basis: basisSchema.nullable(),
      }),
    )
    .max(500),
  contingencyReserve: amount,
  managementReserve: amount,
  narrative: z.object({
    approach: text(4000),
    sources: text(4000),
    assumptions: text(4000),
    constraints: text(4000),
    rangeAndConfidence: text(4000),
    risksAndReserves: text(4000),
    approval: text(4000),
  }),
});
