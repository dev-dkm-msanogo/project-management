import { z } from 'zod';
import { isoDate, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) : stratégie de financement. */

const amount = z.number().int().min(0).max(1_000_000_000_000);

export const saveFundingStrategyBodySchema = z.object({
  preparedOn: isoDate,
  source: text(2000),
  approvedFundingNote: text(2000),
  tranches: z
    .array(
      z.object({
        name: requiredText(120, 'Le nom de la tranche est requis.'),
        period: text(120),
        releaseOn: isoDate,
        activities: text(1000),
        amount,
      }),
    )
    .max(24),
  releaseMechanism: text(2000),
  costCategories: z
    .array(
      z.object({
        name: requiredText(200, 'Le nom de la catégorie est requis.'),
        amount,
        description: text(500),
      }),
    )
    .max(30),
  risks: z
    .array(
      z.object({
        risk: requiredText(500, 'Le risque est requis.'),
        mitigation: requiredText(1000, 'La parade est requise.'),
      }),
    )
    .max(20),
});
