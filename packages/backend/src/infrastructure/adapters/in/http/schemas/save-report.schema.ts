import { z } from 'zod';
import { COMPUTED_KPI_KEYS } from '@shared/index';

/**
 * Validation du corps de requête de sauvegarde (PUT) du rapport exécutif : ses seules parties
 * rédigées (le reste est calculé à partir du projet). Défense en profondeur avant le domaine.
 */

const nonEmpty = z.string().trim().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');
const rag = z.enum(['GREEN', 'AMBER', 'RED', 'NOT_APPLICABLE']);
const computedKeys = new Set<string>(COMPUTED_KPI_KEYS);

export const saveReportBodySchema = z.object({
  reportDate: isoDate,
  reportingPeriod: z.object({ from: isoDate, to: isoDate }),
  overall: z.object({
    statement: nonEmpty.max(1000),
    ragOverride: rag.nullable(),
    overrideReason: z.string().trim().max(1000).nullable(),
  }),
  executiveSummary: z.object({ narrative: nonEmpty.max(5000) }),
  decisions: z
    .array(
      z.object({
        description: nonEmpty.max(500),
        impact: z.string().trim().max(500).nullable(),
        neededBy: isoDate.nullable(),
      }),
    )
    .max(30),
  priorities: z.array(z.object({ description: nonEmpty.max(500), done: z.boolean() })).max(30),
  kpis: z
    .array(
      z.object({
        key: nonEmpty.max(40).refine((key) => !computedKeys.has(key), 'Cet indicateur est calculé à partir du projet.'),
        label: nonEmpty.max(120),
        value: z.string().trim().max(60),
        hint: z.string().trim().max(200).nullable(),
      }),
    )
    .max(20),
  forecast: z.object({
    confidencePercentage: z.number().min(0).max(100),
    statement: z.string().trim().max(1000),
  }),
});

export type SaveReportBody = z.infer<typeof saveReportBodySchema>;
