import { QualityManagementPlan } from '@domain/entities/quality-management-plan';
import { RiskManagementPlan } from '@domain/entities/risk-management-plan';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

/** Plan de gestion de l'échéancier « Projet Alpha » (sections du template, catalogue partagé). */
export const ALPHA_SCHEDULE_PLAN_SECTIONS: Record<string, string> = {
  methodology:
    "Méthode du chemin critique : activités issues des lots de la WBS, enchaînées par diagramme de précédence, durées estimées par analogie et avis d'experts ; échéancier figé après approbation du sponsor. Cycle de vie prédictif, avec des itérations pendant la conception et le développement.",
  tools:
    "L'échéancier (WBS et diagramme de Gantt) est tenu dans l'application de gestion de projet ; la vue des jalons est reprise dans le rapport exécutif mensuel.",
  accuracy:
    "Durées estimées à ±10 % en planification, affinées à ±5 % à l'approche de l'exécution (planification progressive). Réserve de délai d'environ 10 % de la durée totale, détenue par le chef de projet.",
  units:
    "Durées en jours ouvrés (journées de 8 heures), charges en jours-personne. Semaine de travail du lundi au vendredi, jours fériés du Sénégal.",
  varianceThresholds:
    "Écart exprimé en pourcentage de la durée prévue. Jusqu'à 5 % de retard : suivi, sans escalade. De 5 à 10 % : plan d'actions correctives du chef de projet, présenté au point hebdomadaire. Au-delà de 10 %, ou tout glissement de la mise en production : escalade immédiate au sponsor ; toute modification de la référence passe par une demande de modification approuvée.",
  reporting:
    "Hebdomadaire : jalons tenus ou manqués, prochains jalons, écart en pourcentage, principaux risques de délai. Mensuel : diagramme de Gantt à jour dans le rapport exécutif. Revues de passage : revue complète de l'échéancier.",
  procedures:
    "Procédures de la DSI : rapport d'avancement, contrôle intégré des modifications, établissement des références ; modèles d'échéancier et de rapport de jalons de la DSI.",
  updates:
    "L'avancement est collecté chaque vendredi auprès de l'équipe et saisi le jour même ; le chef de projet recalcule le chemin critique et publie le rapport le lundi. La référence ne change que par une demande de modification approuvée.",
};

/** Plan de gestion de la qualité « Projet Alpha » (template PMI). */
export function buildProjectAlphaQualityPlan(): QualityManagementPlan {
  return QualityManagementPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 6),
    standards: [
      'Référentiel qualité logicielle de la DSI : revue de code et tests',
      'OWASP Top 10 : sécurité des applications',
      'Loi n° 2008-12 sur la protection des données à caractère personnel',
      'WCAG 2.1 niveau AA pour les écrans des agents',
      'ISO/IEC 25010 : modèle de qualité du produit logiciel',
    ],
    objectives: [
      {
        objective: 'Fiabilité : aucune anomalie bloquante à la mise en production',
        measure: 'Aucune anomalie bloquante ou majeure ouverte au procès-verbal de recette',
      },
      {
        objective: 'Performance : écrans réactifs dans les dépôts',
        measure: 'Écrans clés affichés en moins de 2 secondes (90e centile) sur le réseau des dépôts',
      },
      {
        objective: 'Données : migration fiable des historiques',
        measure: '100 % des enregistrements migrés rapprochés avec la source, sans écart',
      },
      {
        objective: 'Sécurité : aucune vulnérabilité critique',
        measure: "Aucune vulnérabilité critique ou élevée à l'audit de sécurité",
      },
    ],
    roles: [
      {
        role: 'Chef de projet',
        responsibility: 'Responsable de la qualité du projet ; conduit les audits qualité et en rend compte au sponsor.',
      },
      {
        role: 'Responsable technique',
        responsibility: 'Revues de code, tests de performance et de sécurité, suivi de la correction des anomalies.',
      },
      {
        role: 'Chefs de dépôt',
        responsibility: 'Recette métier et validation des parcours des agents.',
      },
      {
        role: 'Intégrateur',
        responsibility: "Tests unitaires et d'intégration, respect des normes de développement de la DSI.",
      },
    ],
    deliverables: [
      "Plateforme d'exploitation intégrée",
      'Données historiques migrées',
      'Tableau de bord de direction',
      'Supports de formation',
      "Dossier d'exploitation et de maintenance",
    ],
    processes: [
      'Recueil et validation des exigences',
      'Revue de conception',
      'Revue de code à chaque fusion',
      'Enregistrement et tri des anomalies',
      'Contrôle des modifications',
      'Recette métier et acceptation',
      'Mise en production et vérification',
    ],
    managementApproach:
      "Qualité intégrée dès la conception plutôt que contrôlée à la fin : critères d'acceptation écrits avec chaque exigence, revue de code systématique, tests automatisés dans la chaîne d'intégration, maquettes validées par les chefs de dépôt. Un audit qualité a lieu à chaque revue de passage ; ses constats sont suivis jusqu'à leur clôture.",
    controlApproach:
      "Inspections : revue de code à chaque fusion, revue des maquettes et des supports de formation. Tests : unitaires et d'intégration à chaque version, tests de charge et de sécurité avant la recette, rapprochement des données migrées. Anomalies : enregistrées avec leur gravité (1 à 4) et triées sous un jour ouvré ; gravités 1 et 2 corrigées avant la recette. Acceptation : chaque livrable est signé par son valideur désigné.",
    procedures:
      "Politique de revue de code de la DSI, procédure de tri des anomalies, procédure de recette, revue de sécurité applicative.",
  });
}

/** Plan de gestion des risques « Projet Alpha » (template PMI ; réserves des estimations des coûts). */
export function buildProjectAlphaRiskPlan(): RiskManagementPlan {
  return RiskManagementPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 6),
    strategy:
      "Stratégie équilibrée : identifier et réduire au plus tôt les menaces qui pèseraient sur la mise en production d'août 2025, tout en saisissant les opportunités qui améliorent le périmètre ou les délais. Les réponses aux risques sont intégrées à la planification, pas traitées à part.",
    methodology:
      "Planifier, identifier, analyser (qualitativement, quantitativement si besoin), planifier les réponses, les mettre en œuvre, surveiller. Outils : remue-méninges, entretiens, analyse des causes, SWOT, structure de découpage des risques et matrice probabilité × impact 5 × 5. Le registre des risques est l'outil de référence.",
    roles: [
      {
        role: 'Sponsor',
        responsibility:
          'Accepte les risques au niveau du projet, autorise le recours à la réserve de management, arbitre les risques stratégiques.',
      },
      {
        role: 'Chef de projet',
        responsibility:
          "Pilote le processus, tient le registre, anime l'identification et l'analyse, affecte la réserve pour aléas.",
      },
      {
        role: 'Propriétaires de risque',
        responsibility: 'Un responsable nommé par risque : il exécute la réponse prévue et rend compte de son état.',
      },
      {
        role: 'Équipe projet',
        responsibility:
          'Identifie les risques de son domaine, met en œuvre les réponses, signale les risques émergents au point hebdomadaire.',
      },
    ],
    breakdown: {
      TECHNICAL: [
        'Exigences',
        'Technologies et architecture',
        'Intégration aux systèmes existants',
        'Performance et qualité',
        'Sécurité et données personnelles',
      ],
      MANAGEMENT: ['Estimations', 'Planification', 'Communication', 'Pilotage et reporting'],
      ORGANIZATIONAL: [
        'Financement et budget',
        'Disponibilité des ressources',
        'Sponsor et parties prenantes',
        'Priorités et dépendances',
      ],
      EXTERNAL: ['Prestataires et fournisseurs', 'Réglementation', 'Réseau et infrastructures', 'Contexte institutionnel'],
    },
    funding:
      "Réserve pour aléas de 195 M FCFA (environ 10 % des coûts directs), détenue par le chef de projet pour les risques inscrits au registre ; il l'utilise sans approbation et en rend compte chaque semaine. Réserve de management de 120 M FCFA, détenue par le sponsor pour les risques non identifiés : son usage exige une demande de modification approuvée. Les activités de gestion des risques sont couvertes par le temps du chef de projet.",
    contingencyProtocols:
      "La réserve est affectée à des risques précis du registre, pas mise en commun. Quand un risque survient, le chef de projet exécute la réponse prévue et prélève sur la réserve sans autre approbation. Tout prélèvement supérieur à 5 M FCFA est notifié au sponsor. La réserve non consommée est restituée à la clôture et ne finance aucune extension du périmètre.",
    timing:
      "Identification : continue, avec une revue formelle au début de chaque phase. Analyse : sous 5 jours ouvrés. Réponses : sous 10 jours ouvrés pour les risques élevés et critiques, 20 jours pour les risques moyens. Surveillance : les 5 principaux risques à chaque point hebdomadaire, le registre complet chaque mois avec le sponsor. Audit : à chaque revue de passage.",
    tolerances:
      "Sponsor : faible tolérance au dépassement de budget (tout dépassement exige son approbation), tolérance moyenne au retard (2 semaines au plus), aucune tolérance aux manquements de sécurité ou de protection des données. Chefs de dépôt : aucune tolérance à l'interruption des opérations quotidiennes. Exploitation de la DSI : un plan de retour arrière pour chaque mise en production. Chef de projet : accepte seul les risques d'exposition totale inférieure à 5 M FCFA.",
    tracking:
      "Chaque risque est suivi au registre : code, catégorie, description, probabilité, impact, score, responsable, réponse et statut. Un audit des risques a lieu à chaque revue de passage ; ses constats alimentent le registre des leçons apprises.",
    probability: [
      { range: '< 10 %', description: "Improbable ; à suivre seulement si l'impact est grave." },
      { range: '10 à 30 %', description: 'Peu probable mais plausible.' },
      { range: '30 à 50 %', description: 'Chance raisonnable de survenir.' },
      { range: '50 à 70 %', description: 'Plus probable que non.' },
      { range: '> 70 %', description: 'Quasi certain sur la durée du projet.' },
    ],
    impact: [
      { scope: 'Impact négligeable', quality: 'Aucun effet perceptible', time: 'Quelques jours', cost: '< 10 M FCFA' },
      { scope: 'Ajustement mineur', quality: 'Acceptable pour le sponsor', time: "Moins d'une semaine", cost: '10 à 50 M FCFA' },
      { scope: 'Changement notable', quality: 'Revue du sponsor nécessaire', time: '1 à 2 semaines', cost: '50 à 100 M FCFA' },
      { scope: 'Réduction majeure du périmètre', quality: 'Dégradation majeure', time: '2 à 4 semaines', cost: '100 à 200 M FCFA' },
      { scope: "Perte d'un livrable majeur", quality: 'Inacceptable pour le sponsor', time: 'Plus de 4 semaines', cost: '> 200 M FCFA' },
    ],
  });
}
