import { z } from 'zod';
import { entryCode, isoDate, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : métriques, rapport et outils d'analyse qualité. */

export const saveQualityMetricsBodySchema = z.object({
  preparedOn: isoDate,
  metrics: z
    .array(
      z.object({
        code: entryCode,
        item: requiredText(200, "L'élément mesuré est requis."),
        metric: requiredText(300, 'La métrique est requise.'),
        method: requiredText(1000, 'La méthode de mesure est requise.'),
        target: text(200),
      }),
    )
    .max(100),
});

const count = z.number().int().min(0).max(1_000_000);

export const saveQualityReportBodySchema = z.object({
  preparedOn: isoDate,
  periodStart: isoDate,
  periodEnd: isoDate,
  statuses: z
    .array(
      z.object({
        metricCode: entryCode,
        measurement: text(500),
        status: z.enum(['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED']),
      }),
    )
    .max(100),
  defects: z.object({
    logged: count,
    resolved: count,
    openBySeverity: z.tuple([count, count, count, count]),
    trend: text(1000),
    categories: text(1000),
  }),
  recommendations: z
    .array(
      z.object({
        subject: requiredText(200, "L'objet de la recommandation est requis."),
        recommendation: requiredText(2000, 'La recommandation est requise.'),
      }),
    )
    .max(30),
  audit: z.object({
    name: text(200),
    heldOn: isoDate.nullable(),
    goodPractices: text(2000),
    improvements: text(2000),
    deficiencies: text(2000),
  }),
});

const label = (message: string) => requiredText(300, message);

export const saveQualityAnalysesBodySchema = z.object({
  preparedOn: isoDate,
  affinity: z.object({
    question: text(500),
    groups: z
      .array(z.object({ theme: label('Le thème est requis.'), ideas: z.array(label('Idée vide.')).min(1).max(30) }))
      .max(20),
  }),
  causeEffects: z
    .array(
      z.object({
        code: entryCode,
        effect: requiredText(500, "L'effet analysé est requis."),
        categories: z
          .array(z.object({ name: label('La catégorie est requise.'), causes: z.array(label('Cause vide.')).min(1).max(10) }))
          .min(1)
          .max(8),
      }),
    )
    .max(20),
  flowcharts: z
    .array(
      z.object({
        code: entryCode,
        name: requiredText(200, 'Le nom du processus est requis.'),
        description: text(1000),
        steps: z
          .array(
            z.object({
              code: entryCode,
              kind: z.enum(['START', 'ACTION', 'DECISION', 'END']),
              label: label("Le libellé de l'étape est requis."),
              noTarget: entryCode.nullable(),
              noLabel: text(200),
            }),
          )
          .min(2)
          .max(40),
      }),
    )
    .max(20),
});
