import { z } from 'zod';
import {
  entryCode,
  optionalText,
  requiredText,
  scale,
} from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête de sauvegarde du registre des parties prenantes (PUT). */

const engagement = z.enum(['UNAWARE', 'RESISTANT', 'NEUTRAL', 'SUPPORTIVE', 'LEADING']);

const stakeholderSchema = z.object({
  code: entryCode,
  name: requiredText(120, 'Le nom de la partie prenante est requis.'),
  role: requiredText(120, 'Le rôle de la partie prenante est requis.'),
  organization: optionalText(120),
  type: z.enum(['INTERNAL', 'EXTERNAL']),
  contact: optionalText(200),
  power: scale,
  interest: scale,
  currentEngagement: engagement,
  desiredEngagement: engagement,
  requirements: optionalText(2000),
  expectations: optionalText(2000),
  strategy: optionalText(2000),
});

export const saveStakeholderRegisterBodySchema = z.object({
  stakeholders: z.array(stakeholderSchema).max(500),
});
