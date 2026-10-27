import { z } from 'zod';
import {
  entryCode,
  isoDate,
  lines,
  optionalResourceId,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : besoins en ressources, plan de gestion des ressources, charte de l'équipe. */

export const saveResourceRequirementsBodySchema = z.object({
  requirements: z
    .array(
      z.object({
        code: entryCode,
        category: z.enum(['PEOPLE', 'EQUIPMENT', 'MATERIALS', 'SUPPLIES', 'FACILITIES']),
        group: text(120),
        name: requiredText(200, 'Le nom de la ressource est requis.'),
        quantity: text(200),
        grade: text(200),
        assumptions: text(1000),
        comments: text(1000),
      }),
    )
    .max(300),
  narrative: z.object({
    approach: text(4000),
    methods: text(4000),
    sources: text(4000),
    assumptions: text(4000),
    constraints: text(4000),
    rangeAndConfidence: text(4000),
    risksAndReserves: text(4000),
  }),
});

export const saveResourcePlanBodySchema = z.object({
  preparedOn: isoDate,
  roles: z
    .array(
      z.object({
        role: requiredText(120, 'Le rôle est requis.'),
        holderId: optionalResourceId,
        responsibility: text(1000),
        authority: text(1000),
        reportsTo: z.string().trim().max(120).nullable(),
      }),
    )
    .max(50),
  staffAcquisition: text(4000),
  staffRelease: text(4000),
  training: text(4000),
  rewards: text(4000),
  teamDevelopment: text(4000),
  resourceAcquisition: text(4000),
  resourceManagement: text(4000),
});

export const saveTeamCharterBodySchema = z.object({
  preparedOn: isoDate,
  values: lines,
  meetingGuidelines: lines,
  communicationGuidelines: lines,
  decisionMaking: text(4000),
  conflictResolution: text(4000),
  otherAgreements: lines,
  signatures: z
    .array(z.object({ resourceId: resourceId("Le signataire est requis : choisissez une ressource du référentiel."), role: text(120), signedOn: isoDate.nullable() }))
    .max(30),
});
