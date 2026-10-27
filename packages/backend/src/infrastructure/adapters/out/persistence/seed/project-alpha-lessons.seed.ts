import { Lesson, LessonsLearned, type LessonProps } from '@domain/entities/lessons-learned';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

/** Ressources du référentiel. */
const PM_ID = 'res-mamadou-ba';
const TECH_ID = 'res-ibrahima-fall';

const lesson = (props: Omit<LessonProps, 'comments'> & { comments?: string }) =>
  Lesson.create({ comments: '', ...props });

/** Registre des leçons apprises de démonstration « Projet Alpha » (template « Lessons Learned Register »). */
export function buildProjectAlphaLessonsLearned(): LessonsLearned {
  return LessonsLearned.create({
    projectId: 'project-alpha',
    lessons: [
      lesson({
        code: 'LL-001',
        category: 'INITIATION',
        recordedOn: d(2025, 1, 20),
        trigger: 'La charte a été approuvée en une seule réunion de trente minutes.',
        lesson: "Envoyer au sponsor une synthèse d'une page avant toute revue d'approbation.",
        details: 'Reçue deux jours avant, la synthèse a rendu la revue purement confirmatoire.',
        responsibleId: PM_ID,
        comments: 'Pratique reprise pour la revue du plan de management.',
      }),
      lesson({
        code: 'LL-002',
        category: 'STAKEHOLDERS',
        recordedOn: d(2025, 2, 14),
        trigger: 'Les chefs de dépôt, neutres au départ, sont devenus favorables une fois associés aux revues de conception.',
        lesson: 'Associer tôt les futurs utilisateurs aux revues de conception.',
        details: "Les inviter avant la revue du sponsor a désamorcé les objections et amélioré les maquettes.",
        responsibleId: PM_ID,
        comments: 'À reproduire pour tout projet qui touche les dépôts.',
      }),
      lesson({
        code: 'LL-003',
        category: 'RESOURCES',
        recordedOn: d(2025, 2, 17),
        trigger: "Le développeur principal de l'intégrateur a été indisponible deux semaines.",
        lesson: 'Exiger un binôme sur chaque lot critique confié à un prestataire.',
        details: 'Le renfort a évité le glissement, mais sa montée en compétence a coûté trois jours.',
        responsibleId: PM_ID,
        comments: "Clause à ajouter aux contrats d'intégration.",
      }),
      lesson({
        code: 'LL-004',
        category: 'RISK',
        recordedOn: d(2025, 2, 24),
        trigger: "Un champ manquant dans l'API du prestataire n'a été découvert qu'en cours de développement.",
        lesson: "Organiser un atelier technique avec chaque fournisseur d'API avant de figer les estimations.",
        details: "Une heure d'échange en début de projet aurait révélé le manque et permis de planifier le contournement.",
        responsibleId: TECH_ID,
        comments: "À ajouter au modèle de stratégie d'approvisionnement.",
      }),
      lesson({
        code: 'LL-005',
        category: 'PROCUREMENT',
        recordedOn: d(2025, 2, 26),
        trigger: "La grille de sélection a permis d'attribuer le marché des outils de test en une semaine.",
        lesson: 'Fixer les critères pondérés avant de recevoir les offres.',
        details: "Décidés avant l'ouverture des plis, les critères ont évité tout débat sur le choix et accéléré la commission.",
        responsibleId: PM_ID,
      }),
      lesson({
        code: 'LL-006',
        category: 'QUALITY',
        recordedOn: d(2025, 3, 10),
        trigger: 'Les tests de charge ont révélé quatre secondes de réponse sur le tableau de bord.',
        lesson: "Intégrer un budget de performance à la chaîne d'intégration dès le premier lot.",
        details: 'Mesurer à chaque version coûte quelques minutes ; découvrir le problème en tests de charge coûte des jours de reprise.',
        responsibleId: TECH_ID,
        comments: "À intégrer à l'architecture de référence de la DSI.",
      }),
      lesson({
        code: 'LL-007',
        category: 'COMMUNICATION',
        recordedOn: d(2025, 3, 17),
        trigger: 'La validation des supports de formation attend un relecteur unique.',
        lesson: 'Repérer tôt les relecteurs uniques et répartir la relecture.',
        details: 'Le goulet était visible dès la planification du volet formation.',
        responsibleId: 'res-aminata-diallo',
      }),
      lesson({
        code: 'LL-008',
        category: 'PLANNING',
        recordedOn: d(2025, 3, 20),
        trigger: 'Les estimations à trois points des lots de développement sont restées à ±5 % des durées réelles.',
        lesson: "Réserver l'estimation à trois points aux activités que l'équipe connaît.",
        details:
          'Pour les activités nouvelles comme la migration des données, les écarts ont été bien plus larges : préférer des fourchettes larges et une planification progressive.',
        responsibleId: PM_ID,
      }),
    ],
    patterns: [
      { name: 'Impliquer tôt sponsor et utilisateurs', lessonCodes: ['LL-001', 'LL-002'] },
      { name: "Sécuriser les prestataires avant d'engager le planning", lessonCodes: ['LL-003', 'LL-004', 'LL-005'] },
      { name: 'Mesurer la qualité en continu', lessonCodes: ['LL-006'] },
    ],
    transferredOn: null,
  });
}
