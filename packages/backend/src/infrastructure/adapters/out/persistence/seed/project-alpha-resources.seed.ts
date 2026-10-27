import { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import {
  ResourceRequirement,
  ResourceRequirements,
  type ResourceRequirementProps,
} from '@domain/entities/resource-requirements';
import { TeamCharter } from '@domain/entities/team-charter';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

const requirement = (props: ResourceRequirementProps): ResourceRequirement => ResourceRequirement.create(props);

/** Besoins en ressources de démonstration « Projet Alpha » (templates PMI ; cohérents avec la charte). */
export function buildProjectAlphaResourceRequirements(): ResourceRequirements {
  return ResourceRequirements.create({
    projectId: PROJECT_ID,
    requirements: [
      requirement({
        code: 'R-01',
        category: 'PEOPLE',
        group: 'Pilotage',
        name: 'Chef de projet (Mamadou Ba)',
        quantity: '1 personne, 80 %',
        grade: 'Senior',
        assumptions: 'Disponible sur toute la durée ; suppléance assurée par le PMO.',
        comments: 'Interlocuteur unique de la sponsor.',
      }),
      requirement({
        code: 'R-02',
        category: 'PEOPLE',
        group: 'Pilotage',
        name: 'Sponsor (Awa Diop)',
        quantity: '1 personne, environ 5 %',
        grade: 'Direction',
        assumptions: 'Disponible pour les comités de pilotage et les arbitrages.',
        comments: 'Décisionnaire ; temps non imputé au projet.',
      }),
      requirement({
        code: 'R-03',
        category: 'PEOPLE',
        group: 'Analyse métier',
        name: 'Analyste métier',
        quantity: '1 personne, 100 % pendant le recueil, 50 % ensuite',
        grade: 'Confirmé',
        assumptions: "Connaissance des processus d'exploitation.",
        comments: "Charge maximale de février à avril 2025.",
      }),
      requirement({
        code: 'R-04',
        category: 'PEOPLE',
        group: 'Architecture et technique',
        name: 'Architectes solution',
        quantity: '2 personnes, 80 % en conception et développement',
        grade: 'Senior',
        assumptions: 'Disponibilité confirmée par la DSI (hypothèse H-001).',
        comments: 'Ressource critique : congés hors mai et juin.',
      }),
      requirement({
        code: 'R-05',
        category: 'PEOPLE',
        group: 'Architecture et technique',
        name: 'Prestataire intégrateur',
        quantity: 'Équipe de 6 à 8 personnes (environ 14 000 heures)',
        grade: 'Contrat cadre DSI',
        assumptions: 'Mobilisable sous 15 jours après le bon de commande.',
        comments: 'Taux horaire du contrat cadre 2025.',
      }),
      requirement({
        code: 'R-06',
        category: 'PEOPLE',
        group: 'Qualité et recette',
        name: 'Équipe qualité DSI',
        quantity: '2 testeurs, 100 % pendant la recette',
        grade: 'Confirmé',
        assumptions: 'Outils de test disponibles avant la recette.',
        comments: 'Pic de charge en juin et juillet 2025.',
      }),
      requirement({
        code: 'R-07',
        category: 'PEOPLE',
        group: 'Métier',
        name: "Utilisateurs clés de l'exploitation",
        quantity: '6 personnes, environ 10 %',
        grade: 'Experts métier',
        assumptions: "Libérés par la Direction de l'exploitation pour les ateliers et la recette.",
        comments: "Ne relèvent pas de l'autorité du chef de projet.",
      }),
      requirement({
        code: 'R-08',
        category: 'PEOPLE',
        group: 'Formation et changement',
        name: 'Chargée de formation',
        quantity: '1 personne, 60 % en juin et juillet',
        grade: 'Confirmé',
        assumptions: 'Supports produits à partir de la recette.',
        comments: 'Organise les sessions avec les chefs de dépôt.',
      }),
      requirement({
        code: 'R-09',
        category: 'EQUIPMENT',
        group: 'Infrastructure',
        name: "Environnements d'hébergement (développement, recette, production)",
        quantity: '3 environnements',
        grade: 'Hébergement certifié au Sénégal',
        assumptions: 'Capacité suffisante pour 200 utilisateurs simultanés.',
        comments: 'Provisionnés au début du développement.',
      }),
      requirement({
        code: 'R-10',
        category: 'EQUIPMENT',
        group: 'Terminaux',
        name: 'Tablettes des agents de terrain',
        quantity: '120 tablettes',
        grade: 'Durcies, 4G',
        assumptions: "Achetées sur le budget de la Direction de l'exploitation (hors périmètre).",
        comments: 'Hors budget du projet.',
      }),
      requirement({
        code: 'R-11',
        category: 'MATERIALS',
        group: 'Données',
        name: 'Données historiques à migrer',
        quantity: '5 ans, 3 applications sources',
        grade: 'Extractions brutes',
        assumptions: 'Exploitables sans reprise manuelle majeure (hypothèse H-005).',
        comments: 'Échantillon de contrôle de 2 %.',
      }),
      requirement({
        code: 'R-12',
        category: 'SUPPLIES',
        group: 'Logiciels',
        name: 'Licences de la plateforme et de visualisation',
        quantity: '200 utilisateurs',
        grade: 'Édition entreprise',
        assumptions: 'Facturées sur la durée du projet.',
        comments: 'Relèvent ensuite du budget de fonctionnement.',
      }),
      requirement({
        code: 'R-13',
        category: 'SUPPLIES',
        group: 'Services',
        name: 'Outils de test et de charge',
        quantity: '1 abonnement pour la recette',
        grade: 'Standard',
        assumptions: 'Disponibles avant la recette.',
        comments: '',
      }),
      requirement({
        code: 'R-14',
        category: 'FACILITIES',
        group: '',
        name: 'Salle de projet et salles de formation',
        quantity: '1 salle permanente et 3 salles de formation',
        grade: 'Locaux de la DSI et des dépôts',
        assumptions: 'Réservées auprès des services généraux.',
        comments: 'Formations au plus près des dépôts.',
      }),
    ],
    narrative: {
      approach:
        "Besoins estimés à partir des activités de la WBS : pour chacune, type, quantité et niveau des ressources humaines, puis ressources physiques (équipements, données, logiciels, locaux). Estimations recoupées avec le projet intranet 2024 et affinées avec les responsables d'équipe.",
      methods:
        "Ascendante : besoins de chaque activité agrégés par lot puis pour le projet (méthode principale). Analogue : taille d'équipe comparée au projet intranet 2024. Paramétrique : charge du prestataire (heures par fonctionnalité) et sessions de formation (agents par session). Jugement d'expert : architectes et responsable qualité pour les niveaux de compétence.",
      sources:
        "Activités et estimations des coûts ; plan de gestion des ressources (rôles et niveaux) ; taux du contrat cadre DSI 2025 ; offre du prestataire intégrateur ; bilan du projet intranet 2024.",
      assumptions:
        "Équipe interne affectée aux pourcentages prévus jusqu'à la clôture. Prestataire mobilisable sous 15 jours après le bon de commande. Utilisateurs clés libérés par la Direction de l'exploitation. Hébergement souverain disponible au début du développement.",
      constraints:
        "Enveloppe plafonnée à 2 400 M FCFA (charte). Équipe interne limitée aux ressources de la DSI ; tout renfort est validé par les responsables hiérarchiques. Prestataires limités au contrat cadre.",
      rangeAndConfidence:
        "Ressources internes : confiance élevée, ±10 %. Prestataire : confiance moyenne, ±15 %, offre encore préliminaire. Ressources physiques : confiance élevée, ±10 %, prix des contrats existants. Utilisateurs clés : confiance plus faible, ±25 %, disponibilité soumise à l'exploitation.",
      risksAndReserves:
        "Risques suivis dans le registre : dépendance à l'API du prestataire, disponibilité des experts métier et des architectes, qualité des données historiques. La réserve pour aléas des estimations des coûts couvre ces risques identifiés.",
    },
  });
}

/** Plan de gestion des ressources de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaResourcePlan(): ResourceManagementPlan {
  const PM = 'Chef de projet';
  return ResourceManagementPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 3),
    roles: [
      {
        role: 'Sponsor',
        holderId: 'res-awa-diop',
        responsibility:
          'Autorise le projet ; approuve la charte, les références et les changements hors seuils ; assure le financement.',
        authority: 'Approbation finale de la charte, des changements au-delà des seuils du chef de projet et de la clôture.',
        reportsTo: null,
      },
      {
        role: PM,
        holderId: 'res-mamadou-ba',
        responsibility:
          "Planifie, pilote, surveille et clôt le projet ; gère budget, délais, périmètre et risques ; interlocuteur de la sponsor.",
        authority: "Engage jusqu'à 50 M FCFA par poste, réaffecte 5 % entre postes et dirige l'équipe projet.",
        reportsTo: 'Sponsor',
      },
      {
        role: 'Responsable métier',
        holderId: 'res-direction-exploitation',
        responsibility: 'Exprime et valide les besoins, libère les utilisateurs clés, prononce la recette métier.',
        authority: 'Acceptation formelle des livrables métier.',
        reportsTo: 'Sponsor',
      },
      {
        role: 'Analyste métier',
        holderId: 'res-fatou-ndiaye',
        responsibility: 'Recueille et analyse les exigences, tient le registre des exigences.',
        authority: "Propose la priorisation des exigences ; arbitrage par le chef de projet.",
        reportsTo: PM,
      },
      {
        role: 'Architecte solution',
        holderId: 'res-ibrahima-fall',
        responsibility: "Conçoit l'architecture, valide les choix techniques et l'intégration à l'ERP.",
        authority: 'Décide des choix techniques avec le chef de projet, dans les standards de la DSI.',
        reportsTo: PM,
      },
      {
        role: 'Prestataire intégrateur',
        holderId: 'res-integrateur',
        responsibility: 'Développe, intègre et migre les données selon le contrat.',
        authority: 'Organise son équipe ; tout écart de périmètre passe par le chef de projet.',
        reportsTo: PM,
      },
      {
        role: 'Responsable qualité',
        holderId: 'res-khady-sarr',
        responsibility: 'Prépare et conduit la recette technique, suit les anomalies.',
        authority: 'Prononce la conformité technique avant la recette métier.',
        reportsTo: PM,
      },
      {
        role: 'Chargée de formation',
        holderId: 'res-aminata-diallo',
        responsibility: 'Conçoit les supports et anime les sessions de formation.',
        authority: "Valide le plan de formation avec la Direction de l'exploitation.",
        reportsTo: PM,
      },
    ],
    staffAcquisition:
      "L'équipe interne est constituée de collaborateurs de la DSI, affectés par leurs responsables hiérarchiques. Le prestataire intégrateur est mobilisé par bon de commande sur le contrat cadre, signé par le chef de projet dans la limite de sa délégation. Affectations confirmées au 31 janvier 2025.",
    staffRelease:
      "Chaque membre rejoint son service à la fin de sa dernière activité : analyste après la définition du périmètre, équipe qualité après la recette, chargée de formation après les sessions, prestataire après l'accompagnement post-démarrage, chef de projet à la clôture. Un dossier de passation est remis avant chaque départ.",
    training:
      "Utilisateurs clés : formation à la plateforme avant la recette. Agents de terrain : sessions en dépôt avant la mise en production. Équipe d'exploitation DSI : transfert de compétences par le prestataire. Équipe projet : sensibilisation à la protection des données (loi n° 2008-12).",
    rewards:
      "Reconnaissance en comité de direction à la mise en production ; contribution prise en compte dans les entretiens annuels ; remerciements nominatifs dans le bilan de clôture.",
    teamDevelopment:
      "Charte d'équipe établie au lancement ; point d'équipe hebdomadaire et rétrospective à chaque jalon ; une journée par semaine en présentiel pendant le développement pour faciliter les échanges entre métier, DSI et prestataire.",
    resourceAcquisition:
      "Hébergement et licences acquis via les contrats existants de la DSI ; outils de test sur le contrat cadre ; tablettes achetées par la Direction de l'exploitation, hors projet. Toute nouvelle acquisition suit la procédure des marchés.",
    resourceManagement:
      "Utilisation des ressources suivie chaque semaine par le chef de projet ; consommation de l'hébergement revue chaque mois ; inventaire des licences à la recette et à la clôture. Les environnements passent sous la responsabilité de l'exploitation DSI au transfert.",
  });
}

/** Charte de l'équipe de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaTeamCharter(): TeamCharter {
  const signed = d(2025, 2, 5);
  return TeamCharter.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 4),
    values: [
      'Respect : envers chacun et envers les usagers, même sous la pression des délais.',
      'Transparence : problèmes et risques sont signalés tôt.',
      'Qualité : la sécurité et la protection des données ne se négocient pas.',
      "Responsabilité : chacun porte pleinement son domaine ; le chef de projet porte l'escalade.",
      'Amélioration continue : une rétrospective à chaque jalon.',
    ],
    meetingGuidelines: [
      "Point d'équipe chaque lundi de 9 h à 9 h 30, en présentiel ou en visioconférence.",
      'Comité de pilotage le dernier jeudi du mois (une heure).',
      'Ordre du jour envoyé 24 heures avant ; compte rendu sous 24 heures.',
      'Décisions consignées dans le journal des décisions.',
    ],
    communicationGuidelines: [
      'Messagerie instantanée pour les échanges rapides ; courriel pour les décisions et les parties externes ; outil de tickets pour le suivi du travail.',
      'Délais de réponse : messagerie 4 heures ouvrées, courriel 1 jour ouvré, tickets 2 jours ouvrés.',
      "Bloqué plus de deux heures : on demande de l'aide.",
      "Le chef de projet est l'interlocuteur unique de la sponsor et des parties externes, sauf délégation explicite.",
    ],
    decisionMaking:
      "Dans son domaine, chacun décide sans validation du chef de projet, tant que la décision reste dans le périmètre, le délai et le budget approuvés. Les décisions qui touchent plusieurs domaines sont prises par consensus ; le chef de projet tranche en cas de désaccord. Toute décision qui modifie le périmètre, le délai ou le coût suit la maîtrise des changements et requiert l'accord de la sponsor.",
    conflictResolution:
      "1. Échange direct entre les personnes concernées sous un jour ouvré.\n2. Médiation du chef de projet sous deux jours ouvrés.\n3. Escalade à la sponsor si le conflit touche le périmètre, le coût, le délai ou la qualité.\nOn discute des idées, pas des personnes.",
    otherAgreements: [
      'Plage commune de travail : 9 h – 15 h.',
      "Congés de plus d'un jour annoncés deux semaines à l'avance.",
      'Astreinte du prestataire pendant les deux semaines suivant la mise en production.',
      'Documents et code stockés dans les espaces partagés de la DSI.',
      'La charte peut être amendée par consensus ; revue à chaque jalon.',
    ],
    signatures: [
      { resourceId: 'res-mamadou-ba', role: 'Chef de projet', signedOn: signed },
      { resourceId: 'res-fatou-ndiaye', role: 'Analyste métier', signedOn: signed },
      { resourceId: 'res-ibrahima-fall', role: 'Architecte solution', signedOn: signed },
      { resourceId: 'res-khady-sarr', role: 'Responsable qualité', signedOn: signed },
      { resourceId: 'res-aminata-diallo', role: 'Chargée de formation', signedOn: null },
    ],
  });
}
