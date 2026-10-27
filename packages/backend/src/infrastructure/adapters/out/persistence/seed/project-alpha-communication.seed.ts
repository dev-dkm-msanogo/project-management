import { CommunicationPlan } from '@domain/entities/communication-plan';
import { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';
/** Ressources du référentiel. */
const PM_ID = 'res-mamadou-ba';

/** Plan d'engagement de démonstration « Projet Alpha » (template PMI ; cohérent avec le registre). */
export function buildProjectAlphaEngagementPlan(): StakeholderEngagementPlan {
  return StakeholderEngagementPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 5),
    approaches: [
      {
        stakeholderCode: 'PP-001',
        approach:
          'Déjà moteur : maintenir par une revue mensuelle avec le chef de projet et des arbitrages préparés avant chaque comité.',
        informationNeeds: 'Avancement, écarts de coût et de délai, risques majeurs, décisions attendues.',
        frequency: 'Hebdomadaire (synthèse) ; mensuelle (revue)',
        method: 'Synthèse par courriel et réunion de 30 minutes',
        styles: ['PUSH', 'INTERACTIVE'],
      },
      {
        stakeholderCode: 'PP-002',
        approach:
          "Maintenir l'adhésion par un comité mensuel appuyé sur le rapport exécutif et une liste de décisions préparées.",
        informationNeeds: 'Rapport exécutif, décisions attendues, demandes de changement.',
        frequency: 'Mensuelle',
        method: 'Comité de pilotage en présentiel',
        styles: ['PUSH', 'INTERACTIVE'],
      },
      {
        stakeholderCode: 'PP-003',
        approach:
          'Passer de neutre à favorable : associer les chefs de dépôt aux ateliers de recueil, faire une démonstration à chaque itération et confier la recette métier.',
        informationNeeds: "Fonctionnalités livrées, calendrier de formation, impacts sur l'organisation des dépôts.",
        frequency: 'Toutes les deux semaines pendant le développement',
        method: 'Démonstration et atelier',
        styles: ['INTERACTIVE'],
      },
      {
        stakeholderCode: 'PP-004',
        approach:
          "Lever les réticences : un ambassadeur par dépôt, formation avant la recette, tablettes essayées par les agents eux-mêmes, lettre d'information mensuelle.",
        informationNeeds: "Pourquoi le changement, ce qui change pour eux, dates de formation, assistance.",
        frequency: 'Mensuelle ; hebdomadaire avant la mise en production',
        method: "Lettre d'information, réunions de dépôt et ambassadeurs",
        styles: ['PUSH', 'INTERACTIVE'],
      },
      {
        stakeholderCode: 'PP-005',
        approach:
          'Maintenir par un point technique quotidien, un interlocuteur unique et le suivi des engagements contractuels.',
        informationNeeds: "Exigences, priorités, anomalies, critères d'acceptation.",
        frequency: 'Quotidienne pendant le développement',
        method: 'Point technique et outil de tickets',
        styles: ['INTERACTIVE', 'PULL'],
      },
      {
        stakeholderCode: 'PP-006',
        approach: 'Tenir informée : point trimestriel et alerte immédiate en cas de dérive supérieure à 5 %.',
        informationNeeds: 'Consommation du budget, prévisions, demandes de changement à impact financier.',
        frequency: 'Trimestrielle ; alerte au besoin',
        method: 'Note financière et point dédié',
        styles: ['PUSH'],
      },
      {
        stakeholderCode: 'PP-007',
        approach:
          "Informer : présenter le projet au prochain point institutionnel, puis faire un point d'étape avant la mise en production.",
        informationNeeds: 'Objectifs, calendrier, format des données transmises.',
        frequency: 'À chaque jalon majeur',
        method: 'Courrier officiel et réunion institutionnelle',
        styles: ['PUSH'],
      },
      {
        stakeholderCode: 'PP-008',
        approach: 'Informer à la mise en production par les canaux habituels : site, affichage, réseaux sociaux.',
        informationNeeds: 'Améliorations visibles du service, perturbations éventuelles au démarrage.',
        frequency: 'À la mise en production',
        method: 'Communiqué et affichage en station',
        styles: ['PUSH', 'PULL'],
      },
    ],
    pendingChanges:
      "Direction de l'exploitation : de neutre à favorable d'ici la fin de la conception, grâce aux ateliers et aux démonstrations.\nAgents de terrain : de réfractaires à favorables avant la recette (ambassadeurs, formation).\nAutorité organisatrice et usagers : de non informés à neutres à la mise en production.",
    relationships:
      "La sponsor préside le comité de pilotage et arbitre avec la direction financière.\nLes chefs de dépôt relaient la Direction de l'exploitation auprès des agents : c'est le meilleur canal vers le terrain.\nLe prestataire intégrateur n'a qu'un interlocuteur, le chef de projet.\nL'autorité organisatrice échange avec la direction générale : tout contact passe par la sponsor.",
  });
}

/** Plan de communication de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaCommunicationPlan(): CommunicationPlan {
  return CommunicationPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 6),
    communications: [
      {
        audience: 'Awa Diop (sponsor)',
        information: 'Avancement, écarts de coût et de délai, risques majeurs, décisions attendues',
        method: 'Synthèse par courriel et réunion de 30 minutes',
        frequency: "Hebdomadaire ; à la demande en cas d'escalade",
        senderId: PM_ID,
      },
      {
        audience: 'Comité de pilotage',
        information: 'Rapport exécutif : santé du projet, jalons, coûts, risques, décisions',
        method: 'Réunion et rapport exécutif (PDF)',
        frequency: 'Mensuelle',
        senderId: PM_ID,
      },
      {
        audience: 'Équipe projet (DSI et prestataire)',
        information: 'Tâches, avancement, blocages, décisions techniques',
        method: "Point d'équipe et messagerie instantanée",
        frequency: 'Chaque lundi ; quotidienne pendant le développement',
        senderId: PM_ID,
      },
      {
        audience: "Direction de l'exploitation",
        information: 'Démonstrations, calendrier de formation, impacts sur les dépôts',
        method: 'Démonstration et atelier',
        frequency: 'Toutes les deux semaines',
        senderId: 'res-fatou-ndiaye',
      },
      {
        audience: 'Agents de terrain',
        information: 'Pourquoi le changement, ce qui change, dates de formation, assistance',
        method: "Lettre d'information et réunions de dépôt",
        frequency: 'Mensuelle ; hebdomadaire avant la mise en production',
        senderId: 'res-aminata-diallo',
      },
      {
        audience: 'Direction financière',
        information: 'Consommation du budget, prévisions, changements à impact financier',
        method: 'Note financière',
        frequency: 'Trimestrielle ; alerte si écart supérieur à 5 %',
        senderId: PM_ID,
      },
      {
        audience: 'Toutes les parties prenantes',
        information: 'Jalons majeurs : approbation de la charte, fin de la recette, mise en production',
        method: "Courriel officiel et réunion d'information",
        frequency: 'À chaque jalon majeur',
        senderId: 'res-awa-diop',
      },
    ],
    assumptions: [
      "Toutes les parties prenantes internes disposent d'une messagerie professionnelle.",
      "Les chefs de dépôt relaient l'information auprès des agents de terrain.",
      'Le français est la langue de tous les documents du projet.',
      'Le prestataire applique les règles de communication de la DSI.',
    ],
    constraints: [
      "Les agents de terrain ont un accès limité aux postes de travail : privilégier l'affichage et les réunions de dépôt.",
      'Données personnelles des usagers : aucune diffusion hors des canaux autorisés (loi n° 2008-12).',
      'Disponibilité de la sponsor limitée aux créneaux planifiés.',
    ],
    glossary: [
      { term: 'DSI', definition: "Direction des systèmes d'information" },
      { term: 'ERP', definition: 'Progiciel de gestion intégré' },
      { term: 'PMO', definition: 'Bureau de gestion des projets' },
      { term: 'RACI', definition: 'Réalise, rend compte (Approuve), Consulté, Informé' },
      { term: 'SLA', definition: 'Niveau de service contractuel' },
      { term: 'UAT', definition: 'Recette par les utilisateurs (User Acceptance Testing)' },
    ],
  });
}
