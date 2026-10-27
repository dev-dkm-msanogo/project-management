import { ChangeLog } from '@domain/entities/change-log';
import {
  ChangeRequest,
  IMPACT_AREAS,
  type ChangeImpact,
  type ChangeRequestProps,
  type ImpactArea,
} from '@domain/entities/change-request';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const M = 1_000_000;
const PM = 'Mamadou Ba (chef de projet)';
/** Ressources du référentiel. */
const PM_ID = 'res-mamadou-ba';
const SPONSOR = 'Awa Diop (sponsor)';
const CCB = 'Comité de contrôle des modifications';

/** Impacts par domaine ; les domaines non cités sont sans effet. */
const impacts = (given: Partial<Record<ImpactArea, ChangeImpact>>): Record<ImpactArea, ChangeImpact> =>
  Object.fromEntries(IMPACT_AREAS.map((area) => [area, given[area] ?? { direction: null, description: '' }])) as Record<
    ImpactArea,
    ChangeImpact
  >;

/** Demande sans évaluation ni impact détaillé : seuls les champs donnés diffèrent. */
const request = (props: Partial<ChangeRequestProps> & Pick<ChangeRequestProps, 'code' | 'title' | 'requestor' | 'submittedOn' | 'categories' | 'status'>) =>
  ChangeRequest.create({
    description: '',
    justification: '',
    impacts: impacts({}),
    stakeholderRisk: null,
    stakeholderImpact: '',
    costImpact: 0,
    scheduleImpactDays: 0,
    affectedDocuments: '',
    comments: '',
    assessment: null,
    disposition: null,
    decidedOn: null,
    decidedBy: '',
    decisionRationale: '',
    ...props,
  });

/** Registre des modifications de démonstration « Projet Alpha » (templates PMI). */
export function buildProjectAlphaChangeLog(): ChangeLog {
  return ChangeLog.create({
    projectId: 'project-alpha',
    requests: [
      request({
        code: 'CR-001',
        title: "Décaler l'atelier de lancement du 20 au 22 janvier pour la disponibilité du sponsor.",
        requestor: PM,
        submittedOn: d(2025, 1, 15),
        categories: ['SCHEDULE'],
        status: 'CLOSED',
        disposition: 'APPROVED',
        decidedOn: d(2025, 1, 15),
        decidedBy: PM,
        decisionRationale: 'Sans effet sur les jalons : décision du chef de projet, comité informé.',
      }),
      request({
        code: 'CR-002',
        title: 'Mettre à jour la charte avec la nouvelle date de lancement.',
        requestor: PM,
        submittedOn: d(2025, 1, 16),
        categories: ['DOCUMENTS'],
        status: 'CLOSED',
        disposition: 'APPROVED',
        decidedOn: d(2025, 1, 16),
        decidedBy: PM,
      }),
      request({
        code: 'CR-003',
        title: 'Ajouter une messagerie instantanée entre les dépôts.',
        requestor: 'Responsable des opérations',
        submittedOn: d(2025, 2, 5),
        categories: ['SCOPE'],
        costImpact: 85 * M,
        scheduleImpactDays: 15,
        status: 'CLOSED',
        disposition: 'REJECTED',
        decidedOn: d(2025, 2, 12),
        decidedBy: CCB,
        decisionRationale:
          'Hors du périmètre approuvé et couverte par la messagerie de la DSI ; coût et délai incompatibles avec la mise en production.',
      }),
      request({
        code: 'CR-004',
        title: 'Exporter les tableaux de bord au format tableur.',
        requestor: 'Direction financière',
        submittedOn: d(2025, 2, 18),
        categories: ['SCOPE', 'REQUIREMENTS'],
        costImpact: 6 * M,
        scheduleImpactDays: 3,
        status: 'CLOSED',
        disposition: 'DEFERRED',
        decidedOn: d(2025, 2, 20),
        decidedBy: CCB,
        decisionRationale: 'Utile mais non prioritaire : reportée à la phase 2, après la mise en production.',
      }),
      request({
        code: 'CR-005',
        title: 'Ajouter le suivi en temps réel des véhicules au tableau de bord de direction.',
        requestor: SPONSOR,
        submittedOn: d(2025, 3, 3),
        categories: ['SCOPE', 'REQUIREMENTS', 'COST', 'SCHEDULE'],
        description:
          "Afficher sur le tableau de bord de direction la position et l'état des véhicules en service, mis à jour toutes les deux minutes à partir des boîtiers déjà installés. Hors périmètre : l'historique des trajets et les alertes automatiques.",
        justification:
          "La direction générale veut piloter la régularité en temps réel ; les données existent déjà dans les boîtiers des véhicules. Forte valeur pour un effort limité.",
        impacts: impacts({
          SCOPE: { direction: 'INCREASE', description: 'Nouvel écran de suivi des véhicules dans le tableau de bord de direction.' },
          QUALITY: { direction: 'MODIFY', description: "Mêmes exigences de performance que le reste du tableau de bord ; tests de charge étendus au flux des boîtiers." },
          REQUIREMENTS: { direction: 'INCREASE', description: 'Deux exigences fonctionnelles ajoutées au registre des exigences.' },
          COST: { direction: 'INCREASE', description: "48 M FCFA : intégration du flux des boîtiers et écran de suivi, prélevés sur la réserve pour aléas." },
          SCHEDULE: { direction: 'INCREASE', description: "6 jours ouvrés sur le lot « Tableau de bord » ; la mise en production reste fixée au 1er août." },
        }),
        stakeholderRisk: 'MEDIUM',
        stakeholderImpact:
          "Attendue par la direction ; charge supplémentaire pour l'intégrateur pendant le développement, à surveiller.",
        costImpact: 48 * M,
        scheduleImpactDays: 6,
        affectedDocuments:
          "Énoncé du périmètre, WBS, échéancier, estimations et référence des coûts, registre des exigences, registre des risques.",
        comments:
          "Le chef de projet recommande l'approbation : coût couvert par la réserve pour aléas, marge suffisante avant la mise en production. L'intégrateur confirme la faisabilité.",
        status: 'IMPLEMENTED',
        disposition: 'APPROVED',
        decidedOn: d(2025, 3, 5),
        decidedBy: SPONSOR,
        decisionRationale:
          "Approuvée par le sponsor : le suivi en temps réel sert directement l'objectif de régularité. Le chef de projet est autorisé à mettre à jour les références et le registre des risques.",
      }),
      request({
        code: 'CR-006',
        title: 'Prévenir les agents des changements de planning par notification.',
        requestor: 'Chefs de dépôt',
        submittedOn: d(2025, 3, 18),
        categories: ['SCOPE', 'REQUIREMENTS', 'COST'],
        description: "Notifier chaque agent dès que son planning de service change, sans attendre l'affichage au dépôt.",
        justification: "Les changements de dernière minute ne sont connus qu'à l'arrivée au dépôt ; absences et retards en découlent.",
        impacts: impacts({
          SCOPE: { direction: 'INCREASE', description: "Notification des changements de planning dans l'application des agents." },
          COST: { direction: 'INCREASE', description: "Environ 9 M FCFA selon l'alternative recommandée." },
        }),
        stakeholderRisk: 'LOW',
        costImpact: 9 * M,
        scheduleImpactDays: 2,
        assessment: {
          assessedById: PM_ID,
          assessedOn: d(2025, 3, 20),
          alternatives: [
            { name: 'A1 · Rejeter', cost: '0', schedule: 'Aucun', pros: 'Aucun risque pour la référence.', cons: "Les agents restent informés par l'affichage au dépôt." },
            {
              name: 'A2 · Reporter après la mise en production',
              cost: '0 maintenant, environ 12 M FCFA ensuite',
              schedule: 'Aucun maintenant',
              pros: 'Aucune perturbation du développement.',
              cons: 'Plus coûteux plus tard ; attente des chefs de dépôt.',
            },
            {
              name: 'A3 · SMS par un opérateur',
              cost: 'Environ 30 M FCFA par an',
              schedule: '+5 jours',
              pros: "Touche tous les agents, même sans l'application.",
              cons: 'Coût récurrent ; contrat à passer par la commission des marchés.',
            },
            {
              name: "A4 · Notification dans l'application",
              cost: 'Environ 9 M FCFA',
              schedule: '+2 jours',
              pros: "Faible coût ; s'appuie sur l'application des agents.",
              cons: 'Les agents sans tablette ne sont pas couverts.',
            },
          ],
          criteria: [
            { name: 'Valeur pour les agents', description: '', weight: 30, ratings: [1, 3, 5, 4] },
            { name: 'Coût', description: '', weight: 25, ratings: [5, 4, 2, 4] },
            { name: 'Délai', description: '', weight: 20, ratings: [5, 5, 3, 4] },
            { name: 'Risque qualité', description: '', weight: 15, ratings: [5, 5, 3, 4] },
            { name: 'Cohérence stratégique', description: '', weight: 10, ratings: [2, 3, 3, 5] },
          ],
          recommended: "A4 · Notification dans l'application",
          recommendation:
            "Retenir A4 : meilleur score pondéré, coût couvert par la réserve pour aléas, deux jours absorbés par la marge de l'itération en cours. Décision à prendre par le comité de contrôle des modifications.",
          implementationNotes:
            "Après approbation : ajouter l'exigence au registre des exigences ; développer la notification à l'itération suivante ; mettre à jour le registre des modifications et la référence des coûts.",
        },
        status: 'UNDER_REVIEW',
      }),
    ],
  });
}
