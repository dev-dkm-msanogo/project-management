import { Decision } from '@domain/entities/decision';
import { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { Kpi } from '@domain/entities/kpi';
import {
  ExecutiveSummary,
  ForecastConfidence,
  NextPeriodPriority,
  OverallStatus,
} from '@domain/entities/report-blocks';
import { DateRange } from '@domain/value-objects/date-range';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date => new Date(Date.UTC(year, month1to12 - 1, day));

/**
 * Rapport exécutif de démonstration « Projet Alpha », février 2025 : ses parties rédigées. Jalons,
 * périmètre, délai, coût, risques, changements et indicateurs sont calculés au 28 février à partir
 * des éléments du projet (avancement et dépenses simulés au 21 février).
 */
export function buildProjectAlphaReport(): ExecutiveStatusReport {
  return ExecutiveStatusReport.create({
    projectId: 'project-alpha',
    reportDate: d(2025, 2, 28),
    reportingPeriod: DateRange.of(d(2025, 2, 1), d(2025, 2, 28)),
    overall: OverallStatus.create({
      statement:
        "Le lancement est achevé, mais l'exécution prend du retard : le développement avance moins vite que prévu et la définition du périmètre attend le comité de pilotage.",
      override: null,
      overrideReason: null,
    }),
    executiveSummary: ExecutiveSummary.create(
      "Février a vu l'approbation du plan de management (14 février), le séminaire de lancement et l'analyse des risques. Le recueil des besoins s'achève. Le développement a démarré mais accuse un retard lié aux indisponibilités de l'API du prestataire, et la définition du périmètre est suspendue jusqu'à la validation du comité de pilotage. Les coûts restent maîtrisés : l'acompte de 30 % sur les licences a été réglé.",
    ),
    decisions: [
      Decision.create({
        description: "Confirmer l'approche d'intégration du système existant",
        impact: 'Conditionne la reprise du développement des interfaces',
        neededBy: d(2025, 3, 10),
      }),
      Decision.create({
        description: 'Approuver 2 ressources QA supplémentaires pour la recette',
        impact: '+24 000 000 FCFA ; sinon deux semaines de retard sur la recette',
      }),
    ],
    priorities: [
      NextPeriodPriority.create('Obtenir la validation du périmètre par le comité de pilotage'),
      NextPeriodPriority.create('Arrêter un plan de rattrapage du développement avec le prestataire'),
      NextPeriodPriority.create('Terminer le recueil des besoins'),
      NextPeriodPriority.create('Préparer le premier cycle de recette'),
    ],
    kpis: [Kpi.create({ key: 'UTILIZATION', label: "Taux d'utilisation", displayValue: '92 %', hint: 'Équipe projet' })],
    forecast: ForecastConfidence.create(
      55,
      'La date de mise en production dépend du rattrapage du développement : un plan est en préparation avec le prestataire.',
    ),
  });
}
