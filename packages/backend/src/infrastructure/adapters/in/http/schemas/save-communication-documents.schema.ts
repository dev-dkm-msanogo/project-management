import { z } from 'zod';
import {
  entryCode,
  isoDate,
  lines,
  requiredText,
  resourceId,
  text,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : plan d'engagement des parties prenantes, plan de communication. */

export const saveEngagementPlanBodySchema = z.object({
  preparedOn: isoDate,
  approaches: z
    .array(
      z.object({
        stakeholderCode: entryCode,
        approach: requiredText(2000, "L'approche d'engagement est requise."),
        informationNeeds: text(1000),
        frequency: text(300),
        method: text(300),
        styles: z.array(z.enum(['PUSH', 'PULL', 'INTERACTIVE'])).max(3),
      }),
    )
    .max(100),
  pendingChanges: text(4000),
  relationships: text(4000),
});

export const saveCommunicationPlanBodySchema = z.object({
  preparedOn: isoDate,
  communications: z
    .array(
      z.object({
        audience: requiredText(200, 'Le destinataire est requis.'),
        information: requiredText(1000, "L'information à communiquer est requise."),
        method: requiredText(300, 'Le moyen de communication est requis.'),
        frequency: requiredText(300, 'La fréquence est requise.'),
        senderId: resourceId("L'émetteur est requis : choisissez une ressource du référentiel."),
      }),
    )
    .max(100),
  assumptions: lines,
  constraints: lines,
  glossary: z
    .array(z.object({ term: requiredText(80, 'Le terme est requis.'), definition: requiredText(500, 'La définition est requise.') }))
    .max(100),
});
