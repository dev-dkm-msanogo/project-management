import { QualityAnalyses, type FlowStep } from '@domain/entities/quality-analyses';
import { QualityMetrics } from '@domain/entities/quality-metrics';
import { QualityReport } from '@domain/entities/quality-report';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

/** Métriques qualité de démonstration « Projet Alpha », calées sur les exigences de la charte. */
export function buildProjectAlphaQualityMetrics(): QualityMetrics {
  return QualityMetrics.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 12),
    metrics: [
      {
        code: 'QM-001',
        item: 'Disponibilité',
        metric: "Disponibilité de la plateforme pendant les heures d'exploitation",
        method: 'Supervision automatique, relevé mensuel',
        target: '≥ 99,5 %',
      },
      {
        code: 'QM-002',
        item: 'Temps de réponse',
        metric: 'Temps de réponse des écrans courants (95e centile)',
        method: 'Tests de charge sur 10 écrans représentatifs avant chaque mise en production',
        target: '< 3 s',
      },
      {
        code: 'QM-003',
        item: 'Qualité de la migration',
        metric: 'Écarts de rapprochement des données migrées',
        method: "Contrôles de rapprochement par lot sur les cinq ans d'historique",
        target: '0 écart non expliqué',
      },
      {
        code: 'QM-004',
        item: 'Densité de défauts',
        metric: 'Anomalies bloquantes ou majeures par module livré',
        method: "Comptage dans l'outil de suivi des anomalies",
        target: '< 0,5',
      },
      {
        code: 'QM-005',
        item: 'Délai de correction',
        metric: 'Délai moyen entre enregistrement et correction',
        method: 'Rapport hebdomadaire par sévérité',
        target: 'Bloquante < 2 j ; majeure < 5 j',
      },
      {
        code: 'QM-006',
        item: 'Couverture de la recette',
        metric: 'Part des cas de test de recette exécutés',
        method: 'Campagne de recette suivie dans le cahier de recette',
        target: '100 % avant la mise en production',
      },
      {
        code: 'QM-007',
        item: 'Sécurité',
        metric: 'Vulnérabilités élevées ou critiques',
        method: 'Scan OWASP avant la recette et avant la mise en production',
        target: '0',
      },
      {
        code: 'QM-008',
        item: 'Adoption',
        metric: 'Part des agents de terrain formés',
        method: "Feuilles d'émargement des sessions de formation",
        target: '90 % avant la mise en production',
      },
    ],
  });
}

/** Rapport qualité de démonstration « Projet Alpha » (mars 2025). */
export function buildProjectAlphaQualityReport(): QualityReport {
  return QualityReport.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 3, 31),
    periodStart: d(2025, 3, 1),
    periodEnd: d(2025, 3, 31),
    statuses: [
      { metricCode: 'QM-001', measurement: 'Non mesurable avant la mise en production', status: 'NOT_STARTED' },
      { metricCode: 'QM-002', measurement: "2,4 s au 95e centile sur l'environnement de recette", status: 'ON_TRACK' },
      { metricCode: 'QM-003', measurement: 'Lot 2020–2021 rapproché : 3 écarts, tous expliqués', status: 'ON_TRACK' },
      { metricCode: 'QM-004', measurement: '0,7 anomalie bloquante ou majeure par module', status: 'AT_RISK' },
      { metricCode: 'QM-005', measurement: 'Bloquantes : 1,5 j en moyenne ; majeures : 6 j', status: 'AT_RISK' },
      { metricCode: 'QM-006', measurement: '', status: 'NOT_STARTED' },
      { metricCode: 'QM-007', measurement: 'Une vulnérabilité élevée (authentification) en cours de correction', status: 'OFF_TRACK' },
      { metricCode: 'QM-008', measurement: '35 % des agents formés (cible 90 % avant juillet)', status: 'ON_TRACK' },
    ],
    defects: {
      logged: 42,
      resolved: 30,
      openBySeverity: [1, 3, 6, 2],
      trend: 'En baisse : 7 anomalies bloquantes ou majeures ouvertes mi-mars, 4 fin mars.',
      categories: '40 % fonctionnelles, 25 % données, 20 % interface, 10 % performance, 5 % sécurité.',
    },
    recommendations: [
      {
        subject: "Vulnérabilité d'authentification (QM-007)",
        recommendation:
          'Correctif prioritaire du prestataire avant la prochaine livraison ; nouveau scan exigé avant la recette.',
      },
      {
        subject: 'Densité de défauts (QM-004)',
        recommendation:
          'Renforcer les revues de code du module de planification, le plus touché ; point hebdomadaire dédié avec le prestataire.',
      },
      {
        subject: 'Délai de correction (QM-005)',
        recommendation:
          "Affecter un développeur du prestataire au traitement des anomalies majeures jusqu'à la fin de la phase.",
      },
    ],
    audit: {
      name: 'Revue de mi-réalisation',
      heldOn: d(2025, 3, 14),
      goodPractices:
        'Tests automatisés intégrés à la chaîne de livraison ; contrôles de rapprochement de la migration bien documentés.',
      improvements: 'Couverture des tests du module de planification ; délai de traitement des anomalies majeures.',
      deficiencies: 'Une vulnérabilité élevée ouverte (voir QM-007).',
    },
  });
}

const step = (code: string, kind: FlowStep['kind'], label: string, noTarget: string | null = null, noLabel = ''): FlowStep => ({
  code,
  kind,
  label,
  noTarget,
  noLabel,
});

/** Outils d'analyse de démonstration « Projet Alpha » : affinités, causes et effets, logigramme. */
export function buildProjectAlphaQualityAnalyses(): QualityAnalyses {
  return QualityAnalyses.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 3, 18),
    affinity: {
      question: "Qu'est-ce qui fera le succès de la plateforme d'exploitation ?",
      groups: [
        {
          theme: 'Fiabilité des données',
          ideas: [
            'Données de référence uniques',
            'Historique de cinq ans migré sans écart',
            'Saisie unique, sans double saisie',
            'Contrôles automatiques à la saisie',
          ],
        },
        {
          theme: 'Performance et disponibilité',
          ideas: [
            'Écrans affichés en moins de 3 secondes',
            "Disponible pendant toutes les heures d'exploitation",
            'Utilisable sur tablette en dépôt',
            'Mode dégradé en cas de coupure réseau',
          ],
        },
        {
          theme: 'Adoption par le terrain',
          ideas: [
            'Formation au plus près des dépôts',
            'Écrans simples pour les agents',
            'Utilisateurs clés relais',
            'Support réactif au démarrage',
          ],
        },
        {
          theme: 'Pilotage',
          ideas: [
            'Tableau de bord quotidien',
            "Indicateurs partagés avec l'autorité organisatrice",
            'Alertes sur les écarts de service',
          ],
        },
        {
          theme: 'Conformité et sécurité',
          ideas: ['Données hébergées au Sénégal', 'Accès par rôle', 'Traçabilité des modifications'],
        },
      ],
    },
    causeEffects: [
      {
        code: 'CE-001',
        effect: "Densité d'anomalies au-dessus de la cible sur le module de planification",
        categories: [
          {
            name: 'Personnes',
            causes: ['Règles de planification peu connues du prestataire', 'Utilisateurs clés peu disponibles pour les ateliers'],
          },
          {
            name: 'Processus',
            causes: ['Revues de code irrégulières', 'Tests de non-régression en fin de sprint seulement'],
          },
          {
            name: 'Technologie',
            causes: ['Moteur de règles complexe', "Couplage fort avec l'ancien référentiel"],
          },
          {
            name: 'Données',
            causes: ['Données de référence incomplètes', 'Jeux de test peu représentatifs'],
          },
          {
            name: 'Outils',
            causes: ["Pas d'intégration continue sur la branche du module"],
          },
          {
            name: 'Environnement',
            causes: ['Environnement de recette partagé et instable', 'Délais de livraison serrés'],
          },
        ],
      },
    ],
    flowcharts: [
      {
        code: 'FL-001',
        name: 'Traitement des anomalies',
        description: 'De la détection à la clôture, après vérification par un testeur.',
        steps: [
          step('E-001', 'START', 'Anomalie détectée'),
          step('E-002', 'ACTION', "Enregistrer l'anomalie (sévérité, module, reproduction)"),
          step('E-003', 'DECISION', 'Bloquante ou majeure ?', null, 'Planifier dans la prochaine itération'),
          step('E-004', 'ACTION', 'Affecter immédiatement ; suspendre les travaux concernés'),
          step('E-005', 'ACTION', 'Corriger sur une branche dédiée'),
          step('E-006', 'ACTION', 'Revue de code et tests automatisés'),
          step('E-007', 'DECISION', 'Vérifiée par le testeur ?', 'E-005', 'Rouvrir'),
          step('E-008', 'ACTION', "Clore l'anomalie (vérifiée)"),
          step('E-009', 'END', 'Anomalie close'),
        ],
      },
    ],
  });
}
