import { z } from 'zod';
import { isoDate, requiredText, text } from '@infrastructure/adapters/in/http/schemas/common.schema';

/** Validation du corps de requête (PUT) du plan de management du projet. */

const section = text(3000);

export const saveProjectManagementPlanBodySchema = z.object({
  preparedOn: isoDate,
  lifeCycle: z.object({
    overview: section,
    phases: z
      .array(
        z.object({
          name: requiredText(120, 'Le nom de la phase est requis.'),
          period: text(120),
          description: text(1500),
          gate: text(500),
        }),
      )
      .max(20),
    gateReview: section,
  }),
  developmentApproach: z.object({
    selection: section,
    rationale: section,
    cadence: section,
    definitionOfReady: section,
    definitionOfDone: section,
    tooling: section,
    releaseStrategy: section,
  }),
  changeManagement: z.object({
    approach: section,
    board: section,
    process: section,
    thresholds: section,
    documentation: section,
    tools: section,
  }),
  configurationManagement: z.object({
    items: section,
    identification: section,
    versionControl: section,
    changeLinkage: section,
    statusAccounting: section,
    audits: section,
    roles: section,
  }),
});
