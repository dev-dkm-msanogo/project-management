import { ProcurementPlan } from '@domain/entities/procurement-plan';
import { ProcurementStrategy } from '@domain/entities/procurement-strategy';
import { SourceSelection, SourceSelections } from '@domain/entities/source-selections';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

/** Plan de gestion des approvisionnements de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaProcurementPlan(): ProcurementPlan {
  return ProcurementPlan.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 1, 27),
    integration: {
      scope:
        "Chaque achat porte sur un lot de la WBS ; l'énoncé des travaux du prestataire reprend les livrables et critères d'acceptation de l'énoncé du périmètre.",
      schedule:
        "Les dates de livraison contractuelles sont des jalons de l'échéancier ; tout retard fournisseur est remonté au point hebdomadaire.",
      documentation:
        "Bons de commande, procès-verbaux de réception et factures sont classés dans l'espace projet, rattachés au lot de la WBS.",
      risk:
        'Les risques fournisseurs (défaillance, retard, dépendance) sont inscrits au registre des risques avec un responsable désigné.',
      reporting:
        "L'avancement des achats figure dans le rapport exécutif mensuel : engagements, réceptions et écarts au budget.",
    },
    activities: [
      { date: d(2025, 1, 27), activity: "Bon de commande de l'intégrateur sur le contrat cadre" },
      { date: d(2025, 2, 5), activity: 'Consultation de trois fournisseurs pour les outils de test et de charge' },
      { date: d(2025, 2, 19), activity: 'Évaluation des offres selon la grille de sélection' },
      { date: d(2025, 2, 26), activity: 'Attribution et bon de commande des outils de test' },
      { date: d(2025, 3, 3), activity: "Commande de l'hébergement auprès de l'hébergeur certifié" },
      { date: d(2025, 3, 26), activity: 'Réception des prestations et procès-verbal de recette' },
      { date: d(2025, 9, 15), activity: 'Fin de la garantie et clôture des contrats' },
    ],
    metrics: [
      {
        item: 'Délais de livraison',
        metric: 'Livraisons à la date contractuelle',
        measurement: '≥ 90 % des livraisons à date, suivi mensuel',
      },
      {
        item: 'Qualité des livrables',
        metric: 'Anomalies bloquantes à la recette',
        measurement: 'Zéro anomalie bloquante au procès-verbal de réception',
      },
      {
        item: 'Respect du budget',
        metric: 'Écart entre montant engagé et montant commandé',
        measurement: 'Écart ≤ 5 % par contrat',
      },
    ],
    roles: [
      {
        role: 'Chef de projet',
        responsibility: "Exprime le besoin, suit l'exécution et prononce la réception des prestations.",
        authority: "Valide les livrables et les bons de commande jusqu'à 5 M FCFA.",
      },
      {
        role: 'Service des marchés',
        responsibility: 'Conduit les consultations, rédige les contrats et vérifie le référencement des fournisseurs.',
        authority: "Seul habilité à engager la société auprès d'un fournisseur.",
      },
      {
        role: 'Direction financière',
        responsibility: 'Contrôle les engagements et règle les factures après réception.',
        authority: 'Bloque tout paiement sans procès-verbal de réception.',
      },
      {
        role: 'Commission des marchés',
        responsibility: 'Examine les achats hors contrat cadre et les attributions de plus de 25 M FCFA.',
        authority: "Approuve ou rejette l'attribution.",
      },
    ],
    jurisdiction:
      'Droit sénégalais ; contrats libellés en FCFA ; litiges portés devant les juridictions de Dakar après tentative de règlement amiable.',
    independentEstimates:
      "Chaque achat de plus de 5 M FCFA est comparé à l'estimation des coûts du projet ; un écart de plus de 15 % déclenche une analyse avant attribution.",
    riskManagement:
      "Garantie de bonne exécution de 5 % pour l'intégrateur, pénalités de retard plafonnées à 10 % et clause de réversibilité des données.",
    sellers: [
      { name: 'Intégrateur du contrat cadre', description: 'Prestataire de développement référencé par la DSI.' },
      { name: 'Fournisseur de tests A', description: "Éditeur d'outils de test automatisé et de charge." },
      { name: 'Fournisseur de tests B', description: 'Distributeur de solutions de test, présence régionale.' },
      { name: 'Fournisseur de tests C', description: 'Société de services spécialisée en tests de performance.' },
      { name: 'Hébergeur certifié (Sénégal)', description: 'Centre de données local certifié, conforme à la loi sur les données personnelles.' },
    ],
  });
}

/** Stratégie d'approvisionnement de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaProcurementStrategy(): ProcurementStrategy {
  return ProcurementStrategy.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 1, 27),
    deliveryMethod:
      "Développement confié à l'intégrateur du contrat cadre, sous pilotage de la DSI ; outils de test et hébergement achetés séparément.",
    makeOrBuy:
      "Faire : pilotage, recette métier et conduite du changement (compétences internes). Acheter : développement, outils de test et hébergement, faute de capacité interne dans les délais.",
    contractTypes: [
      {
        type: 'FFP',
        note: "Développement et outils de test : périmètre stable, prix ferme par lot avec paiement à la réception.",
      },
      {
        type: 'TM',
        note: 'Assistance après mise en production : volume incertain, régie plafonnée à 40 jours.',
      },
    ],
    incentiveCriteria:
      "Pas d'intéressement ; pénalités de retard de 0,5 % par jour, plafonnées à 10 % du montant du lot.",
    lifecycle: [
      {
        phase: 'Planifier',
        entryCriteria: 'Besoin exprimé et budget disponible',
        deliverables: 'Énoncé des travaux, estimation indépendante',
        exitCriteria: 'Dossier de consultation validé',
      },
      {
        phase: 'Solliciter',
        entryCriteria: 'Dossier de consultation validé',
        deliverables: 'Consultation envoyée aux fournisseurs retenus',
        exitCriteria: 'Offres reçues à la date limite',
      },
      {
        phase: 'Évaluer',
        entryCriteria: 'Offres reçues',
        deliverables: 'Grille de sélection notée',
        exitCriteria: "Recommandation du comité d'évaluation",
      },
      {
        phase: 'Attribuer',
        entryCriteria: 'Recommandation approuvée',
        deliverables: 'Contrat signé, bon de commande',
        exitCriteria: 'Fournisseur notifié',
      },
      {
        phase: 'Gérer',
        entryCriteria: 'Contrat en vigueur',
        deliverables: 'Suivi des livraisons, procès-verbaux de réception',
        exitCriteria: 'Toutes les prestations réceptionnées',
      },
      {
        phase: 'Clore',
        entryCriteria: 'Prestations réceptionnées',
        deliverables: "Solde des factures, levée des garanties, retour d'expérience",
        exitCriteria: 'Contrat clos',
      },
    ],
    knowledgeTransfer:
      "L'intégrateur remet le code source, la documentation d'exploitation et assure deux sessions de transfert de compétences à l'équipe DSI avant la fin de la garantie.",
  });
}

/** Grilles de sélection de démonstration « Projet Alpha » (template « Source Selection Criteria »). */
export function buildProjectAlphaSourceSelections(): SourceSelections {
  return SourceSelections.create({
    projectId: PROJECT_ID,
    evaluations: [
      SourceSelection.create({
        procurement: 'Outils de test et de charge',
        preparedOn: d(2025, 2, 19),
        candidates: ['Fournisseur de tests A', 'Fournisseur de tests B', 'Fournisseur de tests C'],
        criteria: [
          {
            name: 'Capacité technique',
            description: 'Couverture fonctionnelle, tests de charge mobiles, intégration continue.',
            weight: 30,
            ratings: [5, 4, 3],
          },
          {
            name: 'Coût',
            description: 'Coût total sur trois ans : licences, formation et support.',
            weight: 25,
            ratings: [4, 5, 3],
          },
          {
            name: 'Délai',
            description: 'Mise à disposition avant le début de la recette.',
            weight: 15,
            ratings: [5, 3, 5],
          },
          {
            name: 'Références',
            description: "Projets comparables menés en Afrique de l'Ouest.",
            weight: 15,
            ratings: [5, 4, 3],
          },
          {
            name: 'Support local',
            description: 'Assistance en français, aux heures de Dakar.',
            weight: 15,
            ratings: [4, 4, 3],
          },
        ],
        recommendation:
          "Retenir le fournisseur de tests A : meilleur score technique et délai tenu ; négocier le prix des licences pour réduire l'écart avec B.",
        // Grille prête au 28/02/2025, en attente de l'attribution par le sponsor.
        award: null,
      }),
    ],
  });
}
