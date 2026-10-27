import { z } from 'zod';
import { isoDate, requiredText, scale, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation des corps de requête (PUT) : plan, stratégie et sélection des approvisionnements. */

export const saveProcurementPlanBodySchema = z.object({
  preparedOn: isoDate,
  integration: z.object({
    scope: text(2000),
    schedule: text(2000),
    documentation: text(2000),
    risk: text(2000),
    reporting: text(2000),
  }),
  activities: z
    .array(z.object({ date: isoDate, activity: requiredText(500, "L'activité d'achat est requise.") }))
    .max(100),
  metrics: z
    .array(
      z.object({
        item: requiredText(200, "L'élément mesuré est requis."),
        metric: text(500),
        measurement: text(500),
      }),
    )
    .max(50),
  roles: z
    .array(
      z.object({
        role: requiredText(120, 'Le rôle est requis.'),
        responsibility: text(1000),
        authority: text(1000),
      }),
    )
    .max(30),
  jurisdiction: text(2000),
  independentEstimates: text(2000),
  riskManagement: text(2000),
  sellers: z
    .array(z.object({ name: requiredText(200, 'Le nom du fournisseur est requis.'), description: text(1000) }))
    .max(50),
});

export const saveProcurementStrategyBodySchema = z.object({
  preparedOn: isoDate,
  deliveryMethod: text(2000),
  makeOrBuy: text(2000),
  contractTypes: z
    .array(
      z.object({
        type: z.enum(['FFP', 'FPIF', 'FP_EPA', 'CPFF', 'CPIF', 'CPAF', 'TM', 'OTHER']),
        note: requiredText(1000, "Précisez à quoi s'applique le type de contrat."),
      }),
    )
    .max(8),
  incentiveCriteria: text(2000),
  lifecycle: z
    .array(
      z.object({
        phase: requiredText(120, 'Le nom de la phase est requis.'),
        entryCriteria: text(1000),
        deliverables: text(1000),
        exitCriteria: text(1000),
      }),
    )
    .max(20),
  knowledgeTransfer: text(2000),
});

export const saveSourceSelectionsBodySchema = z.object({
  evaluations: z
    .array(
      z.object({
        procurement: requiredText(200, "L'achat évalué est requis."),
        preparedOn: isoDate,
        candidates: z.array(requiredText(200, 'Le nom du candidat est requis.')).min(1).max(10),
        criteria: z
          .array(
            z.object({
              name: requiredText(120, 'Le nom du critère est requis.'),
              description: text(1000),
              weight: z.number().int().min(1).max(100),
              ratings: z.array(scale).max(10),
            }),
          )
          .min(1)
          .max(20),
        recommendation: text(2000),
        // Attribution reprise telle quelle : seul un valideur la pose (route dédiée).
        award: z
          .object({
            supplier: requiredText(200, 'Le fournisseur retenu est requis.'),
            decidedOn: isoDate,
            decidedBy: requiredText(120, "L'auteur de l'attribution est requis."),
            rationale: requiredText(2000, "La justification de l'attribution est requise."),
          })
          .nullable()
          .default(null),
      }),
    )
    .max(50),
});

/** Attribution d'un achat par un valideur. */
export const awardSourceSelectionBodySchema = z.object({
  procurement: requiredText(200, "L'achat est requis."),
  supplier: requiredText(200, 'Le fournisseur retenu est requis.'),
  rationale: requiredText(2000, "Motivez l'attribution."),
});
