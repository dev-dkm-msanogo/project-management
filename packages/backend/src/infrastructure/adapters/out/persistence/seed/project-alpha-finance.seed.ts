import { CostActivity, type CostActivityProps } from '@domain/entities/cost-activity';
import { CostEstimates } from '@domain/entities/cost-estimates';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const M = 1_000_000;
/** Ressources du référentiel. */
const ANALYST_ID = 'res-fatou-ndiaye';
const INTEGRATOR_ID = 'res-integrateur';
const PM_ID = 'res-mamadou-ba';

/** Plan de gestion financière de démonstration « Projet Alpha » (template PMI). */
export const ALPHA_FINANCIAL_PLAN_SECTIONS: Record<string, string> = {
  unitsOfMeasure:
    "Montants en francs CFA (FCFA), présentés en millions dans les synthèses. Charges en jours-homme ou en heures ; durées en jours ouvrés. Aucune facture en devise étrangère n'est prévue.",
  precision:
    "Estimations d'activité arrondies au million de FCFA ; totaux par lot et projet arrondis à 5 M FCFA. Les dépenses réelles sont saisies au franc près et rapprochées chaque mois avec la comptabilité.",
  accuracy:
    "Ordre de grandeur (−25 % / +75 %) à l'approbation de la charte ; budgétaire (−10 % / +25 %) à la référence du périmètre ; définitive (−5 % / +10 %) à la référence des coûts. L'enveloppe de 2 400 M FCFA de la charte est un plafond.",
  fundingSources:
    "Budget d'investissement de la DSI, exercice 2025. Financement interne, sans cofinancement externe. La sponsor est ordonnatrice du budget et approuve les engagements au-delà des seuils du chef de projet.",
  fundingFrequency:
    "Fonds débloqués chaque trimestre selon l'échéancier des paiements du prestataire. Le chef de projet transmet chaque mois une prévision de trésorerie à 30 jours à la direction financière.",
  controlThresholds:
    "Suivi par la valeur acquise. Écart de coût ou de délai jusqu'à 5 % : surveillance. De 5 à 10 % : plan d'actions correctives du chef de projet, présenté dans le rapport hebdomadaire. Au-delà de 10 %, ou si l'estimation à achèvement dépasse l'enveloppe : escalade immédiate à la sponsor ; toute hausse du budget passe par une demande de changement approuvée.",
  performanceRules:
    "Valeur acquise mesurée au niveau des lots de travail : 0/100 pour les livrables courts, 50/50 pour les activités de moins de deux semaines, pourcentage d'avancement jalonné pour les lots longs (développement, migration). Indicateurs suivis chaque semaine : valeur planifiée, valeur acquise, coût réel, écarts de coût et de délai, IPC, IPD, estimation à achèvement et reste à faire.",
  reporting:
    "Hebdomadaire : section coûts du rapport de statut (prévu / réel, écarts, IPC / IPD, estimation à achèvement). Mensuelle : rapprochement avec la comptabilité, courbe en S actualisée, prévision de trésorerie à 90 jours. À chaque jalon : revue financière complète en comité de pilotage.",
  reserveManagement:
    "Réserve pour aléas (environ 10 % des coûts directs) gérée par le chef de projet pour les risques du registre ; son utilisation est rapportée chaque semaine. Réserve de management (environ 5 % de l'enveloppe) détenue par la sponsor ; son utilisation exige une demande de changement approuvée.",
  compliance:
    "Toutes les opérations en FCFA, sans couverture de change. Paiements des prestataires selon les conditions du contrat cadre (30 jours). Marchés au-delà des seuils réglementaires soumis à la commission des marchés. Pièces conservées dix ans.",
  procedures:
    "Procédures de la direction financière : codification analytique des projets, circuit de validation des factures, gestion intégrée des changements du PMO. Chaque lot de travail reçoit un code analytique ; les dépenses réelles y sont imputées à la saisie.",
};

type Seed = Omit<CostActivityProps, 'physicalCost' | 'physicalCostNote' | 'basis'> &
  Partial<Pick<CostActivityProps, 'physicalCost' | 'physicalCostNote' | 'basis'>>;

const activity = (seed: Seed): CostActivity =>
  CostActivity.create({ physicalCost: 0, physicalCostNote: '', basis: null, ...seed });

/**
 * Estimations des coûts de démonstration « Projet Alpha » (templates PMI). Les codes WBS
 * reprennent l'échéancier du plan de projet, qui situe chaque activité dans le temps.
 */
export function buildProjectAlphaCostEstimates(): CostEstimates {
  return CostEstimates.create({
    projectId: 'project-alpha',
    preparedOn: d(2025, 2, 3),
    activities: [
      activity({
        code: 'A001',
        wbsCode: '1.1',
        name: 'Rédaction et approbation de la charte',
        resourceId: PM_ID,
        laborCost: 6 * M,
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
        basis: { method: 'ANALOGOUS', previousActivity: 'Charte du projet intranet (2024)', previousCost: 5 * M, multiplier: 1.2 },
      }),
      activity({
        code: 'A002',
        wbsCode: '1.2',
        name: 'Recueil des besoins (ateliers et entretiens)',
        resourceId: ANALYST_ID,
        laborCost: 72 * M,
        physicalCost: 8 * M,
        physicalCostNote: 'Ateliers terrain et déplacements',
        method: 'PARAMETRIC',
        rangePct: 10,
        confidence: 'HIGH',
        basis: { method: 'PARAMETRIC', costVariable: "Jours-homme d'analyse", unitCost: 600_000, units: 120 },
      }),
      activity({
        code: 'A003',
        wbsCode: '1.3',
        name: 'Projections et dimensionnement technique',
        resourceId: 'res-ibrahima-fall',
        laborCost: 18 * M,
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
      }),
      activity({
        code: 'A004',
        wbsCode: '1.4',
        name: 'Analyse des parties prenantes',
        resourceId: PM_ID,
        laborCost: 4 * M,
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
      }),
      activity({
        code: 'A005',
        wbsCode: '1.6',
        name: 'Lancement du projet',
        resourceId: PM_ID,
        laborCost: 5 * M,
        physicalCost: 3 * M,
        physicalCostNote: 'Atelier de lancement (salle, supports)',
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
      }),
      activity({
        code: 'A006',
        wbsCode: '2.1',
        name: 'Définition du périmètre et des objectifs',
        resourceId: ANALYST_ID,
        laborCost: 15 * M,
        method: 'PARAMETRIC',
        rangePct: 10,
        confidence: 'HIGH',
        basis: { method: 'PARAMETRIC', costVariable: "Jours-homme d'analyse", unitCost: 600_000, units: 25 },
      }),
      activity({
        code: 'A007',
        wbsCode: '2.4',
        name: 'Analyse des risques',
        resourceId: PM_ID,
        laborCost: 6 * M,
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
      }),
      activity({
        code: 'A008',
        wbsCode: '3',
        name: 'Développement et intégration de la plateforme',
        resourceId: INTEGRATOR_ID,
        laborCost: 700 * M,
        physicalCost: 400 * M,
        physicalCostNote: 'Licences, hébergement au Sénégal et environnements',
        method: 'THREE_POINT',
        rangePct: 15,
        confidence: 'MEDIUM',
        basis: { method: 'THREE_POINT', optimistic: 980 * M, mostLikely: 1_080 * M, pessimistic: 1_300 * M },
      }),
      activity({
        code: 'A009',
        wbsCode: '3',
        name: 'Migration des données historiques',
        resourceId: INTEGRATOR_ID,
        laborCost: 180 * M,
        physicalCost: 20 * M,
        physicalCostNote: 'Outil de migration',
        method: 'BOTTOM_UP',
        rangePct: 10,
        confidence: 'HIGH',
        basis: {
          method: 'BOTTOM_UP',
          laborHours: 3_600,
          laborRate: 50_000,
          material: 20 * M,
          supplies: 0,
          equipment: 0,
          travel: 0,
          otherDirect: 0,
          indirect: 0,
          reserve: 0,
        },
      }),
      activity({
        code: 'A010',
        wbsCode: '3.2',
        name: 'Tableau de bord de direction et indicateurs',
        resourceId: INTEGRATOR_ID,
        laborCost: 150 * M,
        physicalCost: 30 * M,
        physicalCostNote: 'Licences de visualisation',
        method: 'THREE_POINT',
        rangePct: 15,
        confidence: 'MEDIUM',
        basis: { method: 'THREE_POINT', optimistic: 160 * M, mostLikely: 175 * M, pessimistic: 220 * M },
      }),
      activity({
        code: 'A011',
        wbsCode: '3.1',
        name: "Pilotage et suivi de l'exécution",
        resourceId: PM_ID,
        laborCost: 45 * M,
        method: 'PARAMETRIC',
        rangePct: 10,
        confidence: 'HIGH',
        basis: { method: 'PARAMETRIC', costVariable: 'Jours de pilotage', unitCost: 750_000, units: 60 },
      }),
      activity({
        code: 'A012',
        wbsCode: '4.2',
        name: 'Recette et assurance qualité',
        resourceId: 'res-khady-sarr',
        laborCost: 90 * M,
        physicalCost: 15 * M,
        physicalCostNote: 'Outils de test et de charge',
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
        basis: {
          method: 'ANALOGOUS',
          previousActivity: 'Recette du projet intranet (2024)',
          previousCost: 87.5 * M,
          multiplier: 1.2,
        },
      }),
      activity({
        code: 'A013',
        wbsCode: '4.4',
        name: 'Formation des utilisateurs',
        resourceId: 'res-aminata-diallo',
        laborCost: 60 * M,
        physicalCost: 25 * M,
        physicalCostNote: 'Supports, salles et déplacements des agents',
        method: 'PARAMETRIC',
        rangePct: 10,
        confidence: 'HIGH',
        basis: { method: 'PARAMETRIC', costVariable: 'Sessions de formation', unitCost: 1_700_000, units: 50 },
      }),
      activity({
        code: 'A014',
        wbsCode: '4.3',
        name: 'Suivi des efforts et des coûts',
        resourceId: 'res-fatou-sow',
        laborCost: 8 * M,
        method: 'ANALOGOUS',
        rangePct: 20,
        confidence: 'MEDIUM',
      }),
      activity({
        code: 'A015',
        wbsCode: '4.1',
        name: 'Mise en production et accompagnement',
        resourceId: INTEGRATOR_ID,
        laborCost: 70 * M,
        physicalCost: 10 * M,
        physicalCostNote: 'Astreinte et accompagnement post-démarrage',
        method: 'ANALOGOUS',
        rangePct: 25,
        confidence: 'LOW',
      }),
    ],
    contingencyReserve: 195 * M,
    managementReserve: 120 * M,
    narrative: {
      approach:
        "Estimations ascendantes à partir des activités de la WBS, combinant estimations paramétriques (taux × charges), analogues (projet intranet 2024) et à trois points (PERT) pour les lots les plus incertains. Les coûts physiques reprennent les devis du contrat cadre.",
      sources:
        "Charges issues des ateliers de recueil ; taux du contrat cadre DSI 2025 (chef de projet 750 000 FCFA par jour, analyste 600 000 FCFA par jour, prestataire 50 000 FCFA par heure) ; devis du prestataire intégrateur ; coûts réels du projet intranet 2024.",
      assumptions:
        "Taux du contrat cadre fermes pour 2025. Licences et hébergement facturés sur la durée du projet seulement : l'exploitation à partir de 2026 relève du budget de fonctionnement. Contrats en FCFA, sans risque de change.",
      constraints:
        "Enveloppe plafonnée à 2 400 M FCFA par la charte. Engagements au-delà de 50 M FCFA par poste soumis à la sponsor. Prestataires limités au contrat cadre de la DSI.",
      rangeAndConfidence:
        "Estimation définitive (−5 % / +10 %) à la référence des coûts. Confiance élevée sur les postes chiffrés sur devis ou par taux ; plus faible sur le développement de la plateforme, le tableau de bord et la mise en production.",
      risksAndReserves:
        "Réserve pour aléas de 195 M FCFA (environ 10 % des coûts directs), gérée par le chef de projet pour les risques identifiés (dépendance à l'API du prestataire, qualité des données historiques). Réserve de management de 120 M FCFA détenue par la sponsor, hors référence des coûts.",
      approval:
        "La référence des coûts (coûts directs et réserve pour aléas) est soumise à l'approbation de la sponsor avant d'être figée ; le financement total requis reste sous l'enveloppe de la charte.",
    },
  });
}
