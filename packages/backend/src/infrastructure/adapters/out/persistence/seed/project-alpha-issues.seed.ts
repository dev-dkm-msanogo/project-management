import { Issue, IssueLog, type IssueProps } from '@domain/entities/issue-log';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

/** Ressources du référentiel. */
const PM_ID = 'res-mamadou-ba';
const TECH_ID = 'res-ibrahima-fall';

/** Problème non lié : seuls les champs donnés diffèrent. */
const issue = (
  props: Omit<IssueProps, 'resolution' | 'comments' | 'riskCode' | 'changeCode' | 'resolvedOn'> & Partial<IssueProps>,
) => Issue.create({ resolution: '', comments: '', riskCode: null, changeCode: null, resolvedOn: null, ...props });

/** Journal des problèmes de démonstration « Projet Alpha » (template « Issue Log »). */
export function buildProjectAlphaIssueLog(): IssueLog {
  return IssueLog.create({
    projectId: 'project-alpha',
    issues: [
      issue({
        code: 'I-001',
        type: 'RESOURCE',
        description:
          "Le développeur principal de l'intégrateur est indisponible deux semaines ; le lot « Données historiques » prend du retard.",
        priority: 'HIGH',
        impact: "Délai : une semaine de glissement possible",
        ownerId: PM_ID,
        raisedOn: d(2025, 2, 10),
        status: 'RESOLVED',
        resolvedOn: d(2025, 2, 17),
        resolution: "L'intégrateur a affecté un développeur de renfort ; priorités réordonnées, aucun glissement net.",
        comments: "Transfert de connaissances ajouté au plan d'actions.",
        riskCode: 'R-002',
      }),
      issue({
        code: 'I-002',
        type: 'TECHNICAL',
        description: "L'API du prestataire ne fournit pas l'identifiant de dépôt nécessaire à l'affectation des agents.",
        priority: 'HIGH',
        impact: 'Délai et qualité : intégration bloquée sur un lot',
        ownerId: TECH_ID,
        raisedOn: d(2025, 2, 24),
        status: 'IN_PROGRESS',
        resolution: "Contournement à l'étude avec le prestataire ; à défaut, table de correspondance tenue par la DSI.",
        comments: 'Point avec le prestataire le 4 mars.',
        riskCode: 'R-001',
      }),
      issue({
        code: 'I-003',
        type: 'STAKEHOLDER',
        description: 'Les chefs de dépôt souhaitent voir les maquettes avant la revue du sponsor.',
        priority: 'LOW',
        impact: 'Engagement des parties prenantes',
        ownerId: PM_ID,
        raisedOn: d(2025, 2, 12),
        status: 'RESOLVED',
        resolvedOn: d(2025, 2, 14),
        resolution: 'Chefs de dépôt invités aux revues de conception hebdomadaires.',
        comments: 'Meilleure adhésion constatée dès la revue suivante.',
      }),
      issue({
        code: 'I-004',
        type: 'SCOPE',
        description: "La direction financière demande l'export des tableaux de bord au format tableur.",
        priority: 'LOW',
        impact: 'Périmètre (mineur)',
        ownerId: PM_ID,
        raisedOn: d(2025, 2, 18),
        status: 'RESOLVED',
        resolvedOn: d(2025, 2, 20),
        resolution: "Demande de modification reportée à la phase 2 ; la direction financière est d'accord.",
        changeCode: 'CR-004',
      }),
      issue({
        code: 'I-005',
        type: 'SCOPE',
        description: 'Le sponsor demande le suivi en temps réel des véhicules sur le tableau de bord de direction.',
        priority: 'HIGH',
        impact: 'Périmètre, coût et délai',
        ownerId: PM_ID,
        raisedOn: d(2025, 3, 3),
        status: 'RESOLVED',
        resolvedOn: d(2025, 3, 5),
        resolution: 'Demande de modification approuvée par le sponsor ; références mises à jour.',
        changeCode: 'CR-005',
      }),
      issue({
        code: 'I-006',
        type: 'QUALITY',
        description: 'Les tests de charge montrent 4 secondes de réponse sur le tableau de bord aux heures de pointe.',
        priority: 'HIGH',
        impact: 'Qualité : objectif de 2 secondes non tenu',
        ownerId: TECH_ID,
        raisedOn: d(2025, 3, 10),
        status: 'IN_PROGRESS',
        resolution: 'Optimisation des requêtes et mise en cache en cours.',
        comments: 'Nouveau test de charge prévu le 24 mars.',
      }),
      issue({
        code: 'I-007',
        type: 'EXTERNAL',
        description: "L'opérateur réseau annonce une maintenance des liaisons des dépôts la semaine de la recette.",
        priority: 'HIGH',
        impact: 'Délai : risque sur la recette',
        ownerId: PM_ID,
        raisedOn: d(2025, 3, 14),
        status: 'ESCALATED',
        resolution: "Report demandé à l'opérateur ; sponsor informé.",
        comments: 'Réponse attendue sous 5 jours ouvrés.',
      }),
      issue({
        code: 'I-008',
        type: 'PROCESS',
        description: "File d'attente sur la validation des supports de formation : un seul relecteur.",
        priority: 'MEDIUM',
        impact: 'Délai : volet formation',
        ownerId: 'res-aminata-diallo',
        raisedOn: d(2025, 3, 17),
        status: 'OPEN',
      }),
    ],
  });
}
