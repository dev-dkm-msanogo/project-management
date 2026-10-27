import { FundingStrategy } from '@domain/entities/funding-strategy';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const M = 1_000_000;

/** Stratégie de financement de démonstration « Projet Alpha », calée sur les estimations des coûts. */
export function buildProjectAlphaFundingStrategy(): FundingStrategy {
  return FundingStrategy.create({
    projectId: 'project-alpha',
    preparedOn: d(2025, 1, 13),
    source:
      "Budget d'investissement 2025 de Dakar Mobilité, ligne « Transformation numérique ». Le sponsor porte le budget ; seul le comité de pilotage peut relever l'enveloppe. Aucun financement externe ni cofinancement.",
    approvedFundingNote:
      "Approuvé à la signature de la charte. Couvre la main-d'œuvre interne et du prestataire, le matériel, l'hébergement, les licences, la formation et la réserve pour aléas gérée par le chef de projet ; la réserve de management reste détenue par le sponsor.",
    tranches: [
      {
        name: 'Tranche 1',
        period: 'Janvier 2025',
        releaseOn: d(2025, 1, 2),
        activities: 'Démarrage, cadrage et planification',
        amount: 300 * M,
      },
      {
        name: 'Tranche 2',
        period: 'Février 2025',
        releaseOn: d(2025, 2, 3),
        activities: 'Conception, recueil des besoins, début de la réalisation',
        amount: 900 * M,
      },
      {
        name: 'Tranche 3',
        period: 'Mars 2025',
        releaseOn: d(2025, 3, 3),
        activities: 'Réalisation, recette, mise en production et clôture (réserve pour aléas comprise)',
        amount: 935 * M,
      },
    ],
    releaseMechanism:
      "Chaque tranche est mise à disposition par la direction financière le premier jour ouvré du mois, à trois conditions : dépenses du mois précédent rapprochées et dans les seuils de contrôle ; prévision de trésorerie à 30 jours transmise par le chef de projet ; aucune anomalie bloquante ouverte. La tranche de mars suit aussi l'approbation du plan de management.",
    costCategories: [
      { name: "Main-d'œuvre", amount: 1_429 * M, description: 'Équipe projet de la DSI et prestataire intégrateur' },
      { name: 'Matériel et hébergement', amount: 311 * M, description: 'Serveurs, tablettes des dépôts, hébergement au Sénégal' },
      { name: 'Licences et outils', amount: 120 * M, description: 'Base de données, outils de développement et de supervision' },
      { name: 'Formation et conduite du changement', amount: 80 * M, description: 'Sessions dans les dépôts, supports' },
      { name: 'Réserve pour aléas', amount: 195 * M, description: 'Gérée par le chef de projet' },
      { name: 'Réserve de management', amount: 120 * M, description: 'Détenue par le sponsor, hors référence des coûts' },
    ],
    risks: [
      {
        risk: 'Pic de dépense en février (réalisation et prestataire le même mois)',
        mitigation: 'Lot du prestataire engagé après validation de la conception ; suivi hebdomadaire de la trésorerie.',
      },
      {
        risk: "Arbitrages budgétaires 2025 au profit d'autres projets",
        mitigation: "Le comité de pilotage a confirmé la priorité de l'enveloppe jusqu'à la clôture.",
      },
      {
        risk: 'Délais de paiement des factures du prestataire (30 jours)',
        mitigation: "La prévision de trésorerie intègre le décalage ; une partie de la dépense de mars peut glisser en avril.",
      },
    ],
  });
}
