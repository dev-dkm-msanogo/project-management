import { ManagementPlans } from '@domain/entities/management-plans';
import { Requirement, type RequirementProps } from '@domain/entities/requirement';
import { RequirementsRegister } from '@domain/entities/requirements-register';
import { ScopeStatement } from '@domain/entities/scope-statement';
import { ALPHA_FINANCIAL_PLAN_SECTIONS } from '@infrastructure/adapters/out/persistence/seed/project-alpha-finance.seed';
import { ALPHA_SCHEDULE_PLAN_SECTIONS } from '@infrastructure/adapters/out/persistence/seed/project-alpha-quality-risk.seed';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

// Objectifs de la charte et livrables de l'énoncé du périmètre, repris dans la traçabilité.
const OBJECTIVE_DELIVERY = "Livrer la plateforme d'exploitation et le tableau de bord de direction";
const OBJECTIVE_SCHEDULE = 'Mettre en production au 1er août 2025';
const OBJECTIVE_EFFICIENCY = 'Réduire les saisies manuelles et fiabiliser les données';
const PLATFORM = "Plateforme d'exploitation intégrée";
const DATA = 'Données historiques migrées';
const DASHBOARD = 'Tableau de bord de direction';
const TRAINING = 'Formation des utilisateurs';
const STEERING = 'Pilotage du projet';

/** Plans de gestion (périmètre, exigences, finances) de démonstration « Projet Alpha » (templates PMI). */
export function buildProjectAlphaManagementPlans(): ManagementPlans {
  return ManagementPlans.create({
    projectId: PROJECT_ID,
    plans: {
      SCOPE_MANAGEMENT: {
        preparedOn: d(2025, 2, 3),
        sections: {
          wbs: "La WBS est décomposée par livrables. Niveau 1 : pilotage du projet, plateforme d'exploitation, migration des données, tableau de bord de direction, formation, transfert à l'exploitation. Chaque lot de travail représente de 8 à 80 heures d'effort et a un responsable unique.",
          wbsDictionary:
            "Pour chaque lot : code WBS, description du travail, responsable, livrable attendu, critères d'acceptation, jalons, ressources et coût estimé. Le chef de projet tient le dictionnaire et le met à jour après chaque changement approuvé.",
          baselineMaintenance:
            "La référence du périmètre comprend l'énoncé du périmètre, la WBS et son dictionnaire. Toute modification passe par une demande de changement dont le chef de projet analyse les impacts (délai, coût, risques). Il décide jusqu'à 5 % d'effort supplémentaire ; au-delà, le comité de pilotage tranche. La référence est versionnée après chaque changement approuvé.",
          deliverableAcceptance:
            "Chaque livrable est d'abord vérifié par l'équipe (contrôle qualité, tests), puis présenté au responsable métier désigné, qui le valide au regard de ses critères d'acceptation. La Direction de l'exploitation signe l'acceptation formelle ; la sponsor prononce l'acceptation finale de la plateforme.",
          requirementsIntegration:
            "Chaque exigence est reliée, dans la matrice de traçabilité, à un objectif de la charte, au livrable qui la réalise et au test qui la vérifie. Une exigence sans livrable, ou un livrable sans exigence, est signalé en revue de périmètre.",
        },
      },
      REQUIREMENTS_MANAGEMENT: {
        preparedOn: d(2025, 2, 3),
        sections: {
          collection:
            "Ateliers avec la Direction de l'exploitation et les agents de planification, entretiens avec la direction financière, observation sur le terrain et revue des applications existantes. Le recueil se clôt au jalon « Recueil des besoins terminé » (10 avril 2025).",
          analysis:
            "Chaque exigence est analysée selon sa valeur métier, son coût, son risque et ses dépendances. Le chef de projet arbitre les conflits entre parties prenantes, puis la sponsor si besoin.",
          categories:
            'Métier (B), parties prenantes (S), fonctionnelles (F), non fonctionnelles (N), transition (T) et projet (P). Le préfixe du code indique la catégorie.',
          documentation:
            "Chaque exigence est enregistrée dans le registre des exigences : identifiant, énoncé, source, catégorie, priorité, critères d'acceptation, méthode de vérification, phase cible et statut. L'analyste métier tient le registre.",
          prioritization:
            "Méthode MoSCoW (Must, Should, Could, Won't), décidée en atelier avec la Direction de l'exploitation et revue à chaque jalon. Les exigences Must conditionnent la mise en production.",
          metrics:
            "Exigences actives avec critères d'acceptation : 100 %. Besoins couverts par au moins une exigence de solution : 100 %. Exigences Must vérifiées avant la mise en production : 100 %.",
          traceability:
            "Chaque exigence est reliée à sa source, à un objectif de la charte, au livrable qui la réalise, à sa méthode de vérification et à sa validation. Les exigences de solution sont reliées aux besoins qu'elles satisfont.",
          tracking:
            'Statuts : proposée, approuvée, en conception, en développement, en test, vérifiée, reportée, rejetée. Le registre est mis à jour chaque semaine en revue de projet.',
          reporting:
            "L'état des exigences (couverture, vérification) est présenté chaque mois au comité de pilotage, avec le rapport exécutif.",
          validation:
            "Le responsable métier de chaque exigence la valide en recette (UAT) ; la Direction de l'exploitation signe le procès-verbal de recette.",
          configuration:
            "Après approbation, toute modification d'exigence suit le circuit des demandes de changement. Le registre est versionné à chaque changement approuvé et l'historique des décisions est conservé.",
        },
      },
      SCHEDULE_MANAGEMENT: { preparedOn: d(2025, 1, 30), sections: ALPHA_SCHEDULE_PLAN_SECTIONS },
      FINANCIAL_MANAGEMENT: { preparedOn: d(2025, 2, 3), sections: ALPHA_FINANCIAL_PLAN_SECTIONS },
    },
  });
}

type Seed = Omit<RequirementProps, 'satisfies'> & { satisfies?: string[] };

const requirement = (seed: Seed): Requirement => Requirement.create({ satisfies: [], ...seed });

/** Registre des exigences de démonstration « Projet Alpha » (cohérent avec la charte). */
export function buildProjectAlphaRequirements(): RequirementsRegister {
  return RequirementsRegister.create({
    projectId: PROJECT_ID,
    requirements: [
      requirement({
        code: 'B-001',
        statement: 'Réduire de 60 % les saisies manuelles trois mois après la mise en production.',
        source: 'Awa Diop (sponsor)',
        category: 'BUSINESS',
        priority: 'MUST',
        acceptanceCriteria: 'Volume de saisies à M+3 inférieur de 60 % à la mesure de janvier 2025',
        verification: 'Mesure avant / après',
        phase: 'Après mise en production',
        status: 'APPROVED',
        businessObjective: OBJECTIVE_EFFICIENCY,
        deliverable: PLATFORM,
        validation: 'Bilan des bénéfices présenté au comité de pilotage',
      }),
      requirement({
        code: 'B-002',
        statement: 'Donner à la direction une vision quotidienne et fiable de la performance du réseau.',
        source: 'Comité de pilotage',
        category: 'BUSINESS',
        priority: 'MUST',
        acceptanceCriteria: 'Indicateurs de la veille disponibles chaque jour à 8 h',
        verification: 'Recette du tableau de bord',
        phase: 'Version 1',
        status: 'IN_DEVELOPMENT',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: DASHBOARD,
        validation: 'Validation par la sponsor',
      }),
      requirement({
        code: 'S-001',
        statement: "Saisir l'exécution des services depuis une tablette, y compris en zone mal couverte.",
        source: 'Agents de terrain',
        category: 'STAKEHOLDER',
        priority: 'MUST',
        acceptanceCriteria: 'Saisie hors connexion synchronisée au retour du réseau',
        verification: 'Test terrain sur trois lignes pilotes',
        phase: 'Version 1',
        status: 'IN_TEST',
        businessObjective: OBJECTIVE_EFFICIENCY,
        deliverable: PLATFORM,
        validation: "Recette terrain signée par la Direction de l'exploitation",
      }),
      requirement({
        code: 'S-002',
        statement: "Disposer des coûts d'exploitation par ligne, rapprochés avec l'ERP.",
        source: 'Direction financière',
        category: 'STAKEHOLDER',
        priority: 'SHOULD',
        acceptanceCriteria: 'Écart de rapprochement inférieur à 1 %',
        verification: "Rapprochement sur un mois de données",
        phase: 'Version 1',
        status: 'APPROVED',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: DASHBOARD,
        validation: 'Validation par la direction financière',
      }),
      requirement({
        code: 'F-001',
        statement: 'Planifier les services : lignes, horaires, affectation des véhicules et des agents.',
        source: "Direction de l'exploitation",
        category: 'FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: "Planification d'une semaine type réalisée sans ressaisie",
        verification: 'Tests fonctionnels et recette (UAT)',
        phase: 'Version 1',
        status: 'VERIFIED',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: PLATFORM,
        validation: "Procès-verbal de recette de la Direction de l'exploitation",
        satisfies: ['B-001'],
      }),
      requirement({
        code: 'F-002',
        statement: "Saisir l'exécution des services sur tablette, hors connexion, avec synchronisation automatique.",
        source: 'Agents de terrain',
        category: 'FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: 'Aucune perte de saisie après quatre heures hors connexion',
        verification: 'Test terrain',
        phase: 'Version 1',
        status: 'IN_TEST',
        businessObjective: OBJECTIVE_EFFICIENCY,
        deliverable: PLATFORM,
        validation: "Recette terrain signée par la Direction de l'exploitation",
        satisfies: ['B-001', 'S-001'],
      }),
      requirement({
        code: 'F-003',
        statement: 'Afficher le tableau de bord de direction (ponctualité, services réalisés, incidents), mis à jour chaque nuit.',
        source: 'Comité de pilotage',
        category: 'FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: 'Indicateurs conformes aux données sources à ±1 %',
        verification: 'Recette du tableau de bord',
        phase: 'Version 1',
        status: 'IN_DEVELOPMENT',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: DASHBOARD,
        validation: 'Validation par la sponsor',
        satisfies: ['B-002'],
      }),
      requirement({
        code: 'F-004',
        statement: "Échanger les coûts d'exploitation avec l'ERP par ses API publiées.",
        source: 'Direction financière',
        category: 'FUNCTIONAL',
        priority: 'SHOULD',
        acceptanceCriteria: 'Synchronisation quotidienne sans erreur pendant cinq jours',
        verification: "Tests d'intégration",
        phase: 'Version 1',
        status: 'IN_DESIGN',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: DASHBOARD,
        validation: 'Validation par la direction financière',
        satisfies: ['S-002'],
      }),
      requirement({
        code: 'F-005',
        statement: 'Exporter les plannings au format demandé par le régulateur.',
        source: 'Autorité organisatrice des transports',
        category: 'FUNCTIONAL',
        priority: 'COULD',
        acceptanceCriteria: '',
        verification: '',
        phase: 'Version 2',
        status: 'DEFERRED',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: PLATFORM,
        validation: '',
      }),
      requirement({
        code: 'N-001',
        statement: "Disponibilité de 99,5 % pendant les heures d'exploitation.",
        source: "Direction de l'exploitation",
        category: 'NON_FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: 'Disponibilité mesurée sur 30 jours supérieure ou égale à 99,5 %',
        verification: 'Supervision en production',
        phase: 'Mise en production',
        status: 'APPROVED',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: PLATFORM,
        validation: "Bilan de stabilité présenté à la Direction de l'exploitation",
        satisfies: ['B-002'],
      }),
      requirement({
        code: 'N-002',
        statement: 'Temps de réponse inférieur à 3 secondes sur les écrans courants.',
        source: 'Agents de terrain',
        category: 'NON_FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: '95e centile inférieur à 3 s avec 200 utilisateurs simultanés',
        verification: 'Test de charge',
        phase: 'Version 1',
        status: 'IN_TEST',
        businessObjective: OBJECTIVE_EFFICIENCY,
        deliverable: PLATFORM,
        validation: 'Recette (UAT)',
        satisfies: ['S-001'],
      }),
      requirement({
        code: 'N-003',
        statement: 'Héberger les données personnelles au Sénégal (loi n° 2008-12).',
        source: 'DSI (conformité)',
        category: 'NON_FUNCTIONAL',
        priority: 'MUST',
        acceptanceCriteria: "Hébergement attesté par le contrat et par l'audit de conformité",
        verification: 'Revue de conformité',
        phase: 'Version 1',
        status: 'VERIFIED',
        businessObjective: OBJECTIVE_DELIVERY,
        deliverable: PLATFORM,
        validation: 'Avis du délégué à la protection des données',
      }),
      requirement({
        code: 'T-001',
        statement: 'Migrer cinq ans de données historiques, contrôlées et rapprochées.',
        source: "Direction de l'exploitation",
        category: 'TRANSITION',
        priority: 'MUST',
        acceptanceCriteria: "Taux d'erreur résiduel inférieur à 2 % sur l'échantillon de contrôle",
        verification: 'Contrôles de migration par échantillonnage',
        phase: 'Mise en production',
        status: 'IN_DEVELOPMENT',
        businessObjective: OBJECTIVE_EFFICIENCY,
        deliverable: DATA,
        validation: "Validation des données par la Direction de l'exploitation",
        satisfies: ['B-002'],
      }),
      requirement({
        code: 'T-002',
        statement: 'Former les utilisateurs clés et les agents de terrain avant la recette.',
        source: "Direction de l'exploitation",
        category: 'TRANSITION',
        priority: 'MUST',
        acceptanceCriteria: 'Utilisateurs clés formés à 100 % ; satisfaction supérieure ou égale à 80 %',
        verification: "Feuilles d'émargement et évaluations",
        phase: 'Avant la recette',
        status: 'APPROVED',
        businessObjective: OBJECTIVE_SCHEDULE,
        deliverable: TRAINING,
        validation: "Bilan de formation validé par la Direction de l'exploitation",
        satisfies: ['S-001'],
      }),
      requirement({
        code: 'P-001',
        statement: "Présenter chaque mois un rapport d'avancement au comité de pilotage.",
        source: 'Comité de pilotage',
        category: 'PROJECT',
        priority: 'SHOULD',
        acceptanceCriteria: 'Rapport diffusé avant chaque comité',
        verification: 'Revue du chef de projet',
        phase: 'Tout le projet',
        status: 'APPROVED',
        businessObjective: OBJECTIVE_SCHEDULE,
        deliverable: STEERING,
        validation: 'Approbation du compte rendu de comité',
      }),
    ],
  });
}

/** Énoncé du périmètre de démonstration « Projet Alpha » (template PMI ; cohérent avec la charte). */
export function buildProjectAlphaScopeStatement(): ScopeStatement {
  return ScopeStatement.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 4, 15),
    description:
      "Le projet livre une plateforme d'exploitation intégrée qui remplace les trois applications actuelles : planification des services, saisie de leur exécution sur tablette (y compris hors connexion) et tableau de bord quotidien pour la direction. Il comprend la reprise de cinq ans de données historiques, la formation des utilisateurs et le transfert de l'exploitation à la DSI.\nLa plateforme s'intègre à l'ERP par ses API publiées et héberge les données personnelles au Sénégal.",
    deliverables: [
      {
        name: PLATFORM,
        description:
          "Application web et tablette couvrant la planification des services, la saisie de leur exécution (y compris hors connexion) et l'administration des référentiels, déployée en production.",
      },
      {
        name: DATA,
        description:
          'Cinq ans de données de service repris des trois applications actuelles, contrôlés, rapprochés et documentés.',
      },
      {
        name: DASHBOARD,
        description:
          'Indicateurs quotidiens de performance du réseau (ponctualité, services réalisés, incidents, coûts par ligne), avec historique et export.',
      },
      {
        name: TRAINING,
        description: 'Supports de formation, sessions pour les utilisateurs clés et les agents de terrain, guide utilisateur.',
      },
      {
        name: "Dossier d'exploitation et de maintenance",
        description:
          "Procédures d'exploitation, de supervision et de maintenance ; transfert de compétences à l'équipe d'exploitation de la DSI.",
      },
      {
        name: STEERING,
        description: 'Plans de gestion, rapports mensuels au comité de pilotage, registres du projet et bilan de clôture.',
      },
    ],
    acceptanceCriteria: [
      "Recette métier (UAT) signée par la Direction de l'exploitation, sans anomalie bloquante ni majeure",
      'Toutes les exigences Must vérifiées avant la mise en production',
      "Disponibilité de 99,5 % aux heures d'exploitation sur les 30 premiers jours",
      "Taux d'erreur résiduel inférieur à 2 % sur les données migrées",
      'Temps de réponse inférieur à 3 secondes sur les écrans courants',
    ],
    exclusions: [
      'Refonte du système billettique (Projet Beta)',
      'Renouvellement du matériel embarqué',
      "Évolutions de l'ERP financier",
      'Reprise des données de plus de cinq ans',
      "Achat des tablettes des agents (budget de la Direction de l'exploitation)",
    ],
  });
}
