import { z } from 'zod';
import {
  entryCode,
  isoDate,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : modèle d'ordonnancement et dictionnaire de la WBS. */

const wbsCode = z.string().trim().regex(/^\d+(\.\d+)*$/, 'Code WBS invalide.');
const amount = z.number().finite().min(0).max(100_000);

const basis = z.discriminatedUnion('method', [
  z.object({ method: z.literal('ANALOGOUS'), reference: text(200), referenceDays: amount, multiplier: amount }),
  z.object({
    method: z.literal('PARAMETRIC'),
    resourceCount: amount,
    hoursPerDay: amount,
    availability: amount,
    performanceFactor: amount,
  }),
  z.object({ method: z.literal('THREE_POINT'), optimistic: amount, mostLikely: amount, pessimistic: amount }),
]);

export const saveScheduleModelBodySchema = z.object({
  preparedOn: isoDate,
  projectStart: isoDate,
  activities: z
    .array(
      z.object({
        code: entryCode,
        name: requiredText(200, "Le nom de l'activité est requis."),
        description: text(1000),
        wbsCode,
        ownerId: resourceId("Le responsable est requis : choisissez une ressource du référentiel."),
        effortHours: amount,
        durationDays: z.number().int().min(0).max(1000),
        predecessors: z
          .array(z.object({ activity: entryCode, type: z.enum(['FS', 'SS', 'FF', 'SF']), lagDays: z.number().int().min(-365).max(365) }))
          .max(20),
        startNoEarlierThan: isoDate.nullable().default(null),
        method: z.enum(['ANALOGOUS', 'PARAMETRIC', 'THREE_POINT']),
        basis: basis.nullable(),
        resources: text(500),
        skills: text(500),
        effortType: z.enum(['DISCRETE', 'APPORTIONED', 'LEVEL_OF_EFFORT']),
        location: text(300),
        constraints: text(500),
        assumptions: text(500),
      }),
    )
    .max(300),
  milestones: z
    .array(
      z.object({
        code: entryCode,
        name: requiredText(200, 'Le nom du jalon est requis.'),
        description: text(500),
        type: z.enum(['MAJOR', 'PHASE_GATE']),
        targetDate: isoDate,
        achievedOn: isoDate.nullable().default(null),
      }),
    )
    .max(100),
  calendar: z.object({
    workingWeekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
    holidays: z.array(z.object({ date: isoDate, name: requiredText(120, 'Le nom du jour férié est requis.') })).max(100),
    notes: text(1000),
  }),
  baseline: z.object({
    purpose: text(2000),
    components: text(2000),
  }),
});

export const saveWbsDictionaryBodySchema = z.object({
  entries: z
    .array(
      z.object({
        wbsCode,
        responsibleId: resourceId("Le responsable est requis : choisissez une ressource du référentiel."),
        description: requiredText(2000, 'La description du travail est requise.'),
        keyDeliverable: text(500),
        assumptions: text(1000),
        milestones: z.array(z.object({ name: requiredText(200, 'Le nom du jalon est requis.'), dueDate: isoDate })).max(20),
        qualityRequirements: text(1000),
        acceptanceCriteria: text(1000),
        technicalInformation: text(1000),
        agreementInformation: text(1000),
      }),
    )
    .max(300),
});
