import { ProjectCharter } from '@domain/entities/project-charter';
import { Money } from '@domain/value-objects/money';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

/** Charte approuvée de démonstration « Projet Alpha », rubriques du template PMI (cohérente avec le rapport). */
export function buildProjectAlphaCharter(): ProjectCharter {
  return ProjectCharter.create({
    projectId: 'project-alpha',
    preparedOn: d(2025, 1, 15),
    customer: "Direction de l'exploitation (interne) ; usagers du réseau (bénéficiaires finaux)",
    purpose:
      "Moderniser les outils d'exploitation en remplaçant des applications vieillissantes par une plateforme intégrée, afin de fiabiliser les données, réduire les saisies manuelles et donner à la direction une vision quotidienne de la performance.",
    description:
      "Concevoir, développer et déployer une plateforme d'exploitation intégrée couvrant la planification des services, le suivi de leur exécution et un tableau de bord de direction ; migrer cinq ans de données historiques ; former les utilisateurs et transférer l'exploitation de la plateforme à la DSI.",
    inScope: [
      "Refonte des applications d'exploitation (planification, suivi des services)",
      'Migration des données historiques sur cinq ans',
      'Tableau de bord de direction',
      'Formation des utilisateurs clés et des agents de terrain',
    ],
    outOfScope: [
      'Refonte du système billettique (Projet Beta)',
      'Renouvellement du matériel embarqué',
      "Évolutions de l'ERP financier",
    ],
    deliverables: [
      "Plateforme d'exploitation intégrée, en production",
      'Données historiques migrées et contrôlées',
      'Tableau de bord de direction',
      'Supports et sessions de formation',
      "Dossier d'exploitation et de maintenance",
    ],
    requirements: [
      'Utilisable sur ordinateur, tablette et mobile',
      "Disponibilité de 99,5 % pendant les heures d'exploitation",
      'Temps de réponse inférieur à 3 secondes sur les écrans courants',
      'Données personnelles hébergées au Sénégal (loi n° 2008-12)',
      "Intégration à l'ERP par ses API publiées",
      "Traçabilité des modifications (journal d'audit)",
    ],
    overallRiskLevel: 'MEDIUM',
    highLevelRisks: [
      "Dépendance à l'API du prestataire intégrateur",
      'Disponibilité des experts métier et des architectes',
      'Qualité des données historiques à migrer',
      'Adhésion des agents de terrain au nouvel outil',
    ],
    objectives: [
      {
        category: 'SCOPE',
        objective: "Livrer la plateforme d'exploitation et le tableau de bord de direction",
        successCriterion: 'Livrables clés acceptés par le sponsor ; recette sans anomalie bloquante',
      },
      {
        category: 'SCHEDULE',
        objective: 'Mettre en production au 1er août 2025',
        successCriterion: 'Mise en production au plus tard à la date du jalon de référence',
      },
      {
        category: 'COST',
        objective: "Tenir l'enveloppe de 2 400 M FCFA",
        successCriterion: 'Écart de coût final compris dans ±5 % du budget approuvé',
      },
      {
        category: 'OTHER',
        objective: 'Réduire les saisies manuelles et fiabiliser les données',
        successCriterion: "−60 % de saisies trois mois après la mise en production ; taux d'erreur inférieur à 2 %",
      },
    ],
    milestones: [
      { name: 'Charte approuvée', targetDate: d(2025, 1, 20) },
      { name: 'Recueil des besoins terminé', targetDate: d(2025, 4, 10) },
      { name: 'Conception terminée', targetDate: d(2025, 4, 30) },
      { name: 'Développement terminé', targetDate: d(2025, 6, 20) },
      { name: 'Recette (UAT) terminée', targetDate: d(2025, 7, 15) },
      { name: 'Mise en production', targetDate: d(2025, 8, 1) },
      { name: 'Clôture du projet', targetDate: d(2025, 9, 30) },
    ],
    budget: Money.of(2_400_000_000, 'XOF'),
    fundingSource: "Budget d'investissement de la DSI, exercice 2025",
    exitCriteria:
      "Plateforme en production et stable pendant 30 jours, recette métier signée, données migrées validées, transfert à l'équipe d'exploitation effectué et bilan de clôture présenté au comité de pilotage.",
    sponsor: {
      resourceId: 'res-awa-diop',
      role: "Directrice des systèmes d'information",
      authority:
        'Approuve la charte, le budget et toute modification au-delà des seuils du chef de projet ; arbitre en dernier ressort ; prononce la clôture du projet.',
    },
    projectManager: {
      resourceId: 'res-mamadou-ba',
      authority: {
        staffing: "Constitue et dirige l'équipe projet affectée ; sollicite les prestataires du contrat cadre dans le budget.",
        budget:
          "Engage les dépenses jusqu'à 50 M FCFA par poste et réaffecte jusqu'à 5 % entre postes ; au-delà, accord du sponsor.",
        technical: "Décide des choix techniques avec l'architecte, dans le respect des standards de la DSI.",
        conflictResolution:
          "Traite les conflits en premier ressort ; les escalade au sponsor, puis au comité de pilotage s'ils persistent.",
      },
    },
  });
}
