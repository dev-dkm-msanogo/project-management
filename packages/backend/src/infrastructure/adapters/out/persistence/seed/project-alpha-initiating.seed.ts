import { BenefitsPlan } from '@domain/entities/benefits-plan';
import { BusinessCase } from '@domain/entities/business-case';
import { ResponsibilityMatrix, type RaciCode } from '@domain/entities/responsibility-matrix';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const M = 1_000_000;

/** Business case de démonstration « Projet Alpha » (template PMI ; cohérent avec la charte). */
export function buildProjectAlphaBusinessCase(): BusinessCase {
  return BusinessCase.create({
    projectId: 'project-alpha',
    preparedOn: d(2024, 12, 10),
    businessNeed:
      "Les applications d'exploitation ont plus de dix ans, ne communiquent pas entre elles et imposent de nombreuses ressaisies. Les données de service sont consolidées à la main, avec des erreurs, et la direction ne dispose pas d'une vision fiable et quotidienne de la performance du réseau.",
    strategicAlignment:
      "Met en œuvre l'axe « pilotage par la donnée » du schéma directeur des systèmes d'information et l'objectif de fiabilisation des données de service fixé par la direction générale.",
    situation: [
      "Trois applications vieillissantes, sans éditeur actif pour deux d'entre elles",
      'Environ 40 % du temps des agents de planification consacré aux ressaisies',
      "Taux d'erreur de 8 % sur les données de service transmises",
      'Aucun tableau de bord consolidé pour la direction',
    ],
    alternatives: [
      {
        option: '1. Statu quo',
        description: 'Conserver les applications actuelles.',
        cost: '0 FCFA (coûts cachés non maîtrisés)',
        outcome: 'REJECTED',
        rationale: 'Risque croissant de panne sans support ; ressaisies et erreurs persistent.',
      },
      {
        option: '2. Mise à niveau des applications existantes',
        description: 'Moderniser chaque application séparément.',
        cost: '≈ 1 500 M FCFA',
        outcome: 'REJECTED',
        rationale: "Ne résout pas l'absence d'intégration ; deux éditeurs ne sont plus actifs.",
      },
      {
        option: "3. Plateforme d'exploitation intégrée",
        description: 'Plateforme unique : planification, suivi, tableau de bord, intégration ERP.',
        cost: '2 400 M FCFA + maintenance annuelle',
        outcome: 'SELECTED',
        rationale: 'Supprime les ressaisies et fiabilise les données ; coût maîtrisé.',
      },
      {
        option: '4. Progiciel en mode SaaS',
        description: 'Solution hébergée par un éditeur.',
        cost: '≈ 1 800 M FCFA + abonnement',
        outcome: 'REJECTED',
        rationale: 'Hébergement hors du Sénégal incompatible avec la loi n° 2008-12.',
      },
    ],
    recommendedSolution:
      "Option 3 : réaliser une plateforme d'exploitation intégrée (planification, suivi des services, tableau de bord de direction, intégration à l'ERP), pour une enveloppe de 2 400 M FCFA et une mise en production au 1er août 2025.",
    financialLines: [
      { label: 'Réalisation de la plateforme', kind: 'COST', amounts: [2_400 * M, 0, 0] },
      { label: 'Hébergement et maintenance', kind: 'COST', amounts: [150 * M, 180 * M, 180 * M] },
      { label: 'Gains de productivité (ressaisies évitées)', kind: 'BENEFIT', amounts: [300 * M, 900 * M, 1_300 * M] },
      { label: 'Licences et support des anciennes applications évités', kind: 'BENEFIT', amounts: [120 * M, 240 * M, 240 * M] },
    ],
    financialNote: 'Montants en FCFA. Année 1 = 2025. Gains estimés de façon prudente, à confirmer avec la direction financière.',
    keyRisks: [
      "Dépendance à l'API du prestataire intégrateur",
      'Disponibilité des experts métier et des architectes',
      'Qualité des données historiques à migrer',
    ],
    recommendation:
      "Approuver le projet selon l'option 3, financer 2 400 M FCFA sur le budget d'investissement de la DSI 2025 et autoriser le sponsor à établir la charte, avec Mamadou Ba comme chef de projet.",
  });
}

/** Plan de gestion des bénéfices de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaBenefitsPlan(): BenefitsPlan {
  return BenefitsPlan.create({
    projectId: 'project-alpha',
    preparedOn: d(2024, 12, 15),
    summary: 'La plateforme doit produire les bénéfices suivants, à la mise en production puis pendant les 12 mois suivants :',
    targetBenefits: [
      '−60 % de saisies manuelles trois mois après la mise en production',
      "Taux d'erreur des données de service inférieur à 2 %",
      'Tableau de bord de direction mis à jour chaque jour',
      'Arrêt des licences et du support des anciennes applications',
    ],
    strategicAlignment:
      "Les bénéfices mettent en œuvre l'axe « pilotage par la donnée » du schéma directeur SI et l'objectif de fiabilisation des données fixé par la direction générale.",
    benefits: [
      {
        name: 'Productivité des équipes de planification',
        realizedFrom: 'Mise en production + 3 mois',
        sustainedThrough: 'En continu',
        metrics: [
          { metric: 'Saisies manuelles par semaine', baseline: '≈ 1 200', target: '≤ 480 (−60 %)', ownerId: 'res-direction-exploitation' },
        ],
      },
      {
        name: 'Fiabilité des données de service',
        realizedFrom: 'Mise en production + 1 mois',
        sustainedThrough: 'En continu, revue trimestrielle',
        metrics: [
          { metric: "Taux d'erreur des données transmises", baseline: '8 %', target: '< 2 %', ownerId: 'res-awa-diop' },
          { metric: 'Délai de consolidation mensuelle', baseline: '5 jours', target: '1 jour', ownerId: 'res-direction-exploitation' },
        ],
      },
      {
        name: 'Pilotage par la direction',
        realizedFrom: 'À la mise en production',
        sustainedThrough: 'En continu',
        metrics: [
          { metric: 'Fréquence de mise à jour du tableau de bord', baseline: 'Mensuelle', target: 'Quotidienne', ownerId: 'res-awa-diop' },
        ],
      },
      {
        name: 'Économies de licences',
        realizedFrom: 'Mise en production + 6 mois',
        sustainedThrough: 'Années 1 à 3',
        metrics: [
          { metric: 'Coûts de licences et de support évités', baseline: '0 FCFA', target: '≥ 240 M FCFA par an', ownerId: 'res-fatou-sow' },
        ],
      },
    ],
    assumptions: [
      'Les anciennes applications sont arrêtées au plus tard six mois après la mise en production',
      'Les agents de terrain sont formés avant la recette',
      'Le périmètre fonctionnel reste stable pendant les 12 mois de mesure',
    ],
    risks: [
      'Maintien en parallèle des anciennes applications au-delà de six mois',
      'Adoption partielle par les agents de terrain',
      "Indicateurs non suivis après le transfert à l'exploitation",
    ],
    governance:
      "La sponsor (Awa Diop) est responsable finale des bénéfices. Le chef de projet établit les situations de départ pendant la recette, puis transfère le suivi à la DSI à la clôture. Les indicateurs sont revus chaque trimestre pendant 12 mois, avec un bilan présenté au comité de pilotage.",
  });
}

/** Matrice RACI de démonstration « Projet Alpha » (template PMI). */
export function buildProjectAlphaResponsibilityMatrix(): ResponsibilityMatrix {
  const participants = [
    { key: 'sponsor', resourceId: 'res-awa-diop', role: 'Sponsor' },
    { key: 'pm', resourceId: 'res-mamadou-ba', role: 'Chef de projet' },
    { key: 'architect', resourceId: 'res-ibrahima-fall', role: 'Architecte' },
    { key: 'analyst', resourceId: 'res-fatou-ndiaye', role: 'Analyste métier' },
    { key: 'integration', resourceId: 'res-integrateur', role: 'Intégration' },
    { key: 'operations', resourceId: 'res-direction-exploitation', role: 'Métier' },
  ];
  // Une ligne par activité : codes dans l'ordre des participants ('-' : non impliqué).
  const rows: [string, string][] = [
    ['Charte du projet', 'AR---C'],
    ['Identification des parties prenantes', 'IRI-IC'],
    ['Recueil des besoins', 'CACR-R'],
    ['Conception', 'IARCCC'],
    ['Développement', 'IACIR-'],
    ['Migration des données', 'IARCRC'],
    ['Recette (UAT)', 'IACRRR'],
    ['Formation des utilisateurs', 'IA-R-C'],
    ['Mise en production', 'ARRCRC'],
    ["Transfert à l'exploitation", 'ARC--R'],
    ['Clôture du projet', 'ARIIII'],
  ];
  return ResponsibilityMatrix.create({
    projectId: 'project-alpha',
    preparedOn: d(2025, 1, 18),
    participants,
    activities: rows.map(([name, codes]) => ({
      name,
      assignments: Object.fromEntries(
        participants
          .map((participant, index) => [participant.key, codes[index]] as const)
          .filter((entry): entry is readonly [string, RaciCode] => entry[1] !== '-'),
      ),
    })),
  });
}
