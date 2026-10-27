import { StakeholderMapping } from '@domain/entities/stakeholder-mapping';
import { StakeholderQuestionnaire } from '@domain/entities/stakeholder-questionnaire';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';

/** Questionnaire d'identification de démonstration « Projet Alpha » (rôles et instances, sans coordonnées). */
export function buildProjectAlphaQuestionnaire(): StakeholderQuestionnaire {
  return StakeholderQuestionnaire.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 1, 10),
    answers: {
      authorization:
        "Awa Diop, sponsor, a autorisé le projet ; le comité de pilotage approuve le budget et les passages de phase.",
      delivery:
        "Mamadou Ba (chef de projet) ; l'équipe projet de la DSI ; le prestataire intégrateur pour le développement.",
      positiveImpact:
        "Direction de l'exploitation (données fiables, tableau de bord quotidien) ; agents de terrain (moins de saisies manuelles) ; direction générale.",
      negativeImpact:
        "Agents de terrain pendant la formation et la bascule ; équipes de la DSI qui maintiennent encore les anciennes applications.",
      resources:
        "Direction financière (budget) ; direction de l'exploitation (mise à disposition des utilisateurs clés) ; prestataire intégrateur.",
      expertise:
        "Utilisateurs clés de l'exploitation (règles de planification des services) ; DSI (architecture, hébergement) ; prestataire intégrateur.",
      currentUsers:
        "Planificateurs et superviseurs de l'exploitation ; contrôleurs de gestion pour les indicateurs mensuels.",
      blockers:
        "Comité de pilotage (arbitrages) ; direction financière (déblocage des tranches) ; autorité organisatrice des transports (exigences de reporting).",
      endUsers:
        "Internes : planificateurs, superviseurs et agents de terrain, direction pour le tableau de bord. Indirects : usagers du réseau.",
      regulators:
        "Oui : l'autorité organisatrice des transports (reporting d'exploitation) et la Commission de protection des données personnelles (loi n° 2008-12).",
      suppliers: "Prestataire intégrateur ; hébergeur au Sénégal ; éditeur de la base de données.",
      operations: "DSI (exploitation et support de niveau 2) ; utilisateurs clés de l'exploitation (support de niveau 1).",
      silent:
        "Agents de terrain des dépôts éloignés, peu représentés dans les ateliers ; usagers du réseau, concernés par la qualité de service.",
      observers: "Direction générale ; direction des ressources humaines (plan de formation) ; partenaires du réseau.",
    },
  });
}

/** Cartographie de démonstration « Projet Alpha » : saillance et directions des 8 parties prenantes du registre. */
export function buildProjectAlphaStakeholderMapping(): StakeholderMapping {
  return StakeholderMapping.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 1, 17),
    entries: [
      { stakeholderCode: 'PP-001', urgency: true, legitimacy: true, direction: 'UPWARD' },
      { stakeholderCode: 'PP-002', urgency: true, legitimacy: true, direction: 'UPWARD' },
      { stakeholderCode: 'PP-003', urgency: true, legitimacy: true, direction: 'SIDEWARD' },
      { stakeholderCode: 'PP-004', urgency: true, legitimacy: true, direction: 'SIDEWARD' },
      { stakeholderCode: 'PP-005', urgency: true, legitimacy: true, direction: 'OUTWARD' },
      { stakeholderCode: 'PP-006', urgency: false, legitimacy: true, direction: 'SIDEWARD' },
      { stakeholderCode: 'PP-007', urgency: false, legitimacy: true, direction: 'OUTWARD' },
      { stakeholderCode: 'PP-008', urgency: false, legitimacy: true, direction: 'OUTWARD' },
    ],
  });
}
