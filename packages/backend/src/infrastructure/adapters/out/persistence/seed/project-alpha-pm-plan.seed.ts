import { ProjectManagementPlan } from '@domain/entities/project-management-plan';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

/**
 * Plan de management de démonstration « Projet Alpha » : cycle de vie calé sur les jalons de
 * la charte, approche hybride, gestion des modifications et de la configuration.
 */
export function buildProjectAlphaManagementPlan(): ProjectManagementPlan {
  return ProjectManagementPlan.create({
    projectId: 'project-alpha',
    preparedOn: d(2025, 2, 10),
    lifeCycle: {
      overview:
        "Cycle de vie hybride : prédictif pour la gouvernance, le budget et les achats ; itératif pour la conception et le développement. Six phases successives, chacune close par une revue de passage.",
      phases: [
        {
          name: 'Démarrage',
          period: 'janv. 2025',
          description: 'Charte approuvée, sponsor et chef de projet désignés, parties prenantes identifiées.',
          gate: 'Charte approuvée (20 janvier)',
        },
        {
          name: 'Planification',
          period: 'févr.–mars 2025',
          description:
            "Plan de management et plans subsidiaires, exigences, WBS, échéancier et budget de référence, risques identifiés.",
          gate: 'Plan de management approuvé par le sponsor',
        },
        {
          name: 'Analyse et conception',
          period: 'avr. 2025',
          description: 'Ateliers avec les chefs de dépôt, maquettes itératives, architecture validée par la DSI.',
          gate: 'Conception validée (30 avril)',
        },
        {
          name: 'Développement',
          period: 'mai–juin 2025',
          description: 'Itérations de deux semaines avec démonstration au métier ; intégration continue.',
          gate: 'Développement terminé (20 juin)',
        },
        {
          name: 'Recette',
          period: 'juil. 2025',
          description: 'Tests fonctionnels, de charge et de sécurité ; recette métier par les dépôts.',
          gate: 'Recette validée (15 juillet)',
        },
        {
          name: 'Déploiement et clôture',
          period: 'août–sept. 2025',
          description:
            "Mise en production, formation des agents, accompagnement renforcé, retour d'expérience et clôture.",
          gate: 'Mise en production (1er août), clôture (30 septembre)',
        },
      ],
      gateReview:
        'Chaque phase se termine par une revue de passage avec le sponsor, le chef de projet et les parties prenantes clés. Décision : poursuivre, poursuivre sous conditions, suspendre ou arrêter ; elle est consignée dans le journal des décisions.',
    },
    developmentApproach: {
      selection:
        "Planification prédictive pour tenir le budget et la date de mise en production attendus par la direction ; itérations courtes pour la conception et le développement, où les besoins des dépôts se précisent en cours de route.",
      rationale:
        "Gouvernance, sécurité et conformité stables : prédictif. Ergonomie des tablettes et parcours des agents à valider avec le terrain : itératif. Date de mise en production fixée par la direction générale : jalons prédictifs.",
      cadence:
        'Itérations de deux semaines pendant la conception et le développement : planification le lundi (1 h 30), point quotidien de 15 minutes, démonstration et rétrospective un vendredi sur deux, revue de passage en fin de phase.',
      definitionOfReady:
        "Récit utilisateur clair, critères d'acceptation, maquette si besoin, charge estimée, aucune dépendance bloquante.",
      definitionOfDone:
        "Critères d'acceptation satisfaits, revue de code faite, tests automatisés passants, déployé en recette, vérifié par le chef de projet, documenté.",
      tooling:
        "Outil de tickets de la DSI pour le carnet et les itérations ; dépôt Git privé ; intégration et déploiement continus vers la recette et la production ; canal projet pour la communication courante.",
      releaseStrategy:
        "Intégration continue à chaque modification ; déploiement en recette à chaque fusion ; mise en production uniquement aux versions planifiées approuvées par le chef de projet. Les évolutions après la mise en production relèvent de la maintenance.",
    },
    changeManagement: {
      approach:
        "Toute demande de modification passe par un formulaire et est inscrite au registre des modifications par le chef de projet. Son impact sur le périmètre, le délai, le coût, la qualité et les risques est analysé avant décision.",
      board:
        "Comité de contrôle des modifications : le sponsor (présidence, décision finale), le chef de projet (coordination et analyse d'impact), un représentant des opérations (métier) et le responsable infrastructure de la DSI (technique et sécurité). Réunion hebdomadaire pendant l'exécution ; revue d'urgence possible sous 24 heures.",
      process:
        "1. Soumettre : toute partie prenante adresse sa demande au chef de projet. 2. Enregistrer sous un jour ouvré. 3. Analyser l'impact avec les experts. 4. Décider en comité : approuver, reporter ou rejeter. 5. Mettre en œuvre et mettre à jour les références. 6. Vérifier puis clore la demande.",
      thresholds:
        "Jusqu'à 1 M FCFA et 2 jours : le chef de projet décide et informe le comité. De 1 à 5 M FCFA ou de 3 à 5 jours : décision du comité. Au-delà, ou tout report de la mise en production : décision du sponsor.",
      documentation:
        "Demandes, décisions et justifications sont tracées dans le registre des modifications. Les modifications approuvées sont annoncées à l'équipe au point hebdomadaire, sous deux jours ouvrés.",
      tools: "Formulaire de demande de modification, registre des modifications et évaluation d'impact, dans l'espace projet.",
    },
    configurationManagement: {
      items:
        "Plan de management et références de base ; charte, énoncé du périmètre et WBS ; exigences et matrice de traçabilité ; code source, configurations d'environnement et chaîne de déploiement ; maquettes ; contrats et bons de commande.",
      identification:
        'Identifiant unique ALPHA-[CATÉGORIE]-[NNNN]-vX.Y (ex. ALPHA-DOC-0012-v1.3) ; catégories DOC, CODE, MAQ, CONF et CONTRAT.',
      versionControl:
        "Documents : espace projet versionné, version majeure à chaque approbation, mineure pour les brouillons. Code : Git (branches principale, de développement et de fonctionnalité), versions sémantiques. Les éléments de référence sont verrouillés : toute modification passe par une demande approuvée.",
      changeLinkage:
        "Les modifications de configuration suivent le plan de gestion des modifications ; une modification approuvée incrémente la version de l'élément et figure au registre des modifications.",
      statusAccounting:
        'Le chef de projet tient le registre des éléments de configuration (version courante, responsable, statut, date de dernière modification) ; synthèse dans le rapport hebdomadaire.',
      audits:
        "Audit fonctionnel en fin de recette : le produit répond aux exigences. Audit physique à la mise en production : les éléments déployés correspondent aux versions approuvées. Tout écart donne lieu à une demande de modification.",
      roles:
        'Chef de projet : responsable du processus et du registre. Développeurs : éléments de code et de configuration. Sponsor : approuve les configurations de référence aux revues de passage.',
    },
  });
}
