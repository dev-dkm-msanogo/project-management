import { ScheduleModel, type Activity, type DurationBasis } from '@domain/entities/schedule-model';
import type { NetworkDependency } from '@domain/entities/schedule-network';
import { WbsDictionary } from '@domain/entities/wbs-dictionary';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (year: number, month1to12: number, day: number): Date =>
  new Date(Date.UTC(year, month1to12 - 1, day));

const PROJECT_ID = 'project-alpha';
/** Ressources du référentiel. */
const ANALYST_ID = 'res-fatou-ndiaye';
const CONTROLLER_ID = 'res-fatou-sow';
const PM_ID = 'res-mamadou-ba';
const TECH_ID = 'res-ibrahima-fall';
const SITE = 'Siège de Dakar Mobilité';

const fs = (...codes: string[]): NetworkDependency[] => codes.map((activity) => ({ activity, type: 'FS', lagDays: 0 }));

/** Activité : seuls les champs qui diffèrent des valeurs par défaut sont donnés. */
const activity = (
  props: Pick<Activity, 'code' | 'name' | 'wbsCode' | 'ownerId' | 'effortHours' | 'durationDays'> &
    Partial<Omit<Activity, 'basis'>> & { basis?: DurationBasis },
): Activity => ({
  description: '',
  predecessors: [],
  method: props.basis?.method ?? 'ANALOGOUS',
  resources: '',
  skills: '',
  effortType: 'DISCRETE',
  location: SITE,
  constraints: '',
  assumptions: '',
  ...props,
  basis: props.basis ?? null,
});

/** Modèle d'ordonnancement de démonstration « Projet Alpha », rattaché à la WBS de l'échéancier. */
export function buildProjectAlphaScheduleModel(): ScheduleModel {
  return ScheduleModel.create({
    projectId: PROJECT_ID,
    preparedOn: d(2025, 2, 10),
    projectStart: d(2025, 1, 2),
    activities: [
      activity({
        code: 'A-001',
        name: 'Rédiger la charte du projet',
        description: 'Rédiger la charte, la faire relire par la DSI et obtenir la signature du sponsor.',
        wbsCode: '1.1.1',
        ownerId: PM_ID,
        effortHours: 40,
        durationDays: 6,
        basis: { method: 'ANALOGOUS', reference: 'Charte du projet billettique', referenceDays: 5, multiplier: 1.2 },
        resources: '1 chef de projet ; relecture par la DSI',
        skills: 'Cadrage de projet, rédaction',
      }),
      activity({
        code: 'A-002',
        name: 'Identifier les parties prenantes',
        description: 'Recenser les parties prenantes et analyser leur pouvoir et leur intérêt.',
        wbsCode: '1.4',
        ownerId: PM_ID,
        effortHours: 24,
        durationDays: 5,
        predecessors: fs('A-001'),
      }),
      activity({
        code: 'A-003',
        name: 'Conduire la recherche préalable',
        description: 'Entretiens avec les dépôts et analyse des systèmes existants.',
        wbsCode: '1.2',
        ownerId: ANALYST_ID,
        effortHours: 120,
        durationDays: 10,
        predecessors: fs('A-001'),
        basis: { method: 'PARAMETRIC', resourceCount: 2, hoursPerDay: 8, availability: 75, performanceFactor: 1 },
        resources: '2 analystes métier à 75 %',
        skills: "Analyse métier, conduite d'entretiens",
      }),
      activity({
        code: 'A-004',
        name: 'Établir les projections',
        description: 'Projections de charge et de coûts sur la durée du projet.',
        wbsCode: '1.3',
        ownerId: CONTROLLER_ID,
        effortHours: 32,
        durationDays: 6,
        predecessors: fs('A-001'),
        basis: { method: 'PARAMETRIC', resourceCount: 1, hoursPerDay: 8, availability: 70, performanceFactor: 1 },
      }),
      activity({
        code: 'A-005',
        name: 'Fixer les directives du projet',
        wbsCode: '1.5',
        ownerId: PM_ID,
        effortHours: 24,
        durationDays: 5,
        predecessors: fs('A-002'),
      }),
      activity({
        code: 'A-006',
        name: 'Lancer le projet',
        description: "Réunion de lancement avec l'équipe, l'intégrateur et les chefs de dépôt.",
        wbsCode: '1.6',
        ownerId: PM_ID,
        effortHours: 16,
        durationDays: 3,
        predecessors: fs('A-004', 'A-005'),
      }),
      activity({
        code: 'A-007',
        name: 'Définir le périmètre et les objectifs',
        description: "Rédiger l'énoncé du périmètre et les objectifs mesurables avec le métier.",
        wbsCode: '2.1',
        ownerId: PM_ID,
        effortHours: 48,
        durationDays: 6,
        predecessors: fs('A-006'),
        basis: { method: 'THREE_POINT', optimistic: 4, mostLikely: 6, pessimistic: 9 },
        resources: '1 chef de projet ; 1 analyste métier à mi-temps',
        skills: "Cadrage, animation d'ateliers",
        constraints: 'Ateliers à tenir avant la fin de janvier, disponibilité des chefs de dépôt.',
        assumptions: 'Aucune demande de modification pendant la définition.',
      }),
      activity({
        code: 'A-008',
        name: 'Établir le budget',
        wbsCode: '2.2',
        ownerId: CONTROLLER_ID,
        effortHours: 24,
        durationDays: 4,
        predecessors: fs('A-007'),
        basis: { method: 'THREE_POINT', optimistic: 3, mostLikely: 4, pessimistic: 6 },
      }),
      activity({
        code: 'A-009',
        name: 'Élaborer le plan de communication',
        wbsCode: '2.3',
        ownerId: PM_ID,
        effortHours: 24,
        durationDays: 5,
        predecessors: [{ activity: 'A-007', type: 'SS', lagDays: 2 }],
      }),
      activity({
        code: 'A-010',
        name: 'Planifier la gestion des risques',
        wbsCode: '2.4',
        ownerId: PM_ID,
        effortHours: 32,
        durationDays: 5,
        predecessors: fs('A-007'),
      }),
      activity({
        code: 'A-011',
        name: "Mettre en place le suivi de l'avancement",
        description: "Point hebdomadaire, collecte de l'avancement et premier rapport exécutif.",
        wbsCode: '3.1',
        ownerId: PM_ID,
        effortHours: 24,
        durationDays: 4,
        predecessors: fs('A-008', 'A-010'),
        effortType: 'LEVEL_OF_EFFORT',
        resources: '1 chef de projet',
      }),
      activity({
        code: 'A-012',
        name: 'Superviser les indicateurs',
        wbsCode: '3.2.1',
        ownerId: TECH_ID,
        effortHours: 32,
        durationDays: 5,
        predecessors: fs('A-011'),
        basis: { method: 'PARAMETRIC', resourceCount: 1, hoursPerDay: 8, availability: 80, performanceFactor: 1 },
      }),
      activity({
        code: 'A-013',
        name: 'Établir les prévisions',
        wbsCode: '3.2.2',
        ownerId: CONTROLLER_ID,
        effortHours: 24,
        durationDays: 4,
        predecessors: fs('A-012'),
      }),
      activity({
        code: 'A-014',
        name: 'Actualiser les diagrammes',
        wbsCode: '3.3.1',
        ownerId: PM_ID,
        effortHours: 16,
        durationDays: 3,
        predecessors: fs('A-013'),
      }),
      activity({
        code: 'A-015',
        name: 'Suivre les objectifs du projet',
        wbsCode: '4.1',
        ownerId: PM_ID,
        effortHours: 40,
        durationDays: 6,
        predecessors: [{ activity: 'A-011', type: 'SS', lagDays: 2 }],
        effortType: 'LEVEL_OF_EFFORT',
      }),
      activity({
        code: 'A-016',
        name: 'Contrôler les livrables qualité',
        wbsCode: '4.2',
        ownerId: TECH_ID,
        effortHours: 40,
        durationDays: 6,
        predecessors: fs('A-012'),
        basis: { method: 'THREE_POINT', optimistic: 4, mostLikely: 6, pessimistic: 10 },
      }),
      activity({
        code: 'A-017',
        name: 'Suivre les efforts et les coûts',
        wbsCode: '4.3',
        ownerId: CONTROLLER_ID,
        effortHours: 32,
        durationDays: 5,
        predecessors: fs('A-013'),
      }),
      activity({
        code: 'A-018',
        name: 'Mesurer la performance du projet',
        description: 'Analyse des écarts de délai et de coût, présentée au comité de pilotage.',
        wbsCode: '4.4',
        ownerId: PM_ID,
        effortHours: 32,
        durationDays: 5,
        predecessors: [...fs('A-014', 'A-016'), { activity: 'A-017', type: 'FF', lagDays: 0 }],
        resources: '1 chef de projet ; 1 contrôleur de gestion',
        skills: 'Analyse de la valeur acquise',
        constraints: 'Présentation au comité de pilotage de fin mars.',
      }),
    ],
    milestones: [
      { code: 'J-001', name: 'Charte approuvée', description: 'Le sponsor signe la charte ; le projet est autorisé.', type: 'MAJOR', targetDate: d(2025, 1, 20), achievedOn: d(2025, 1, 20) },
      {
        code: 'J-002',
        name: 'Plan de management approuvé',
        description: 'Plans subsidiaires rédigés ; références du périmètre, des délais et des coûts approuvées.',
        type: 'PHASE_GATE',
        targetDate: d(2025, 2, 14),
        achievedOn: d(2025, 2, 14),
      },
      { code: 'J-003', name: 'Recueil des besoins terminé', description: 'Exigences et matrice de traçabilité approuvées.', type: 'PHASE_GATE', targetDate: d(2025, 4, 10), achievedOn: null },
      { code: 'J-004', name: 'Conception terminée', description: 'Maquettes et architecture validées.', type: 'PHASE_GATE', targetDate: d(2025, 4, 30), achievedOn: null },
      { code: 'J-005', name: 'Développement terminé', description: 'Toutes les fonctionnalités livrées en recette.', type: 'MAJOR', targetDate: d(2025, 6, 20), achievedOn: null },
      { code: 'J-006', name: 'Recette (UAT) terminée', description: 'Recette métier signée par les dépôts.', type: 'PHASE_GATE', targetDate: d(2025, 7, 15), achievedOn: null },
      { code: 'J-007', name: 'Mise en production', description: 'Plateforme en service dans les dépôts.', type: 'MAJOR', targetDate: d(2025, 8, 1), achievedOn: null },
      { code: 'J-008', name: 'Clôture du projet', description: 'Leçons apprises transférées ; acceptation formelle signée.', type: 'MAJOR', targetDate: d(2025, 9, 30), achievedOn: null },
    ],
    calendar: {
      workingWeekdays: [1, 2, 3, 4, 5],
      holidays: [
        { date: d(2025, 1, 1), name: "Jour de l'an" },
        { date: d(2025, 3, 31), name: 'Korité' },
        { date: d(2025, 4, 4), name: "Fête de l'indépendance" },
        { date: d(2025, 4, 21), name: 'Lundi de Pâques' },
        { date: d(2025, 5, 1), name: 'Fête du travail' },
        { date: d(2025, 5, 29), name: 'Ascension' },
        { date: d(2025, 6, 9), name: 'Lundi de Pentecôte' },
        { date: d(2025, 8, 15), name: 'Assomption' },
        { date: d(2025, 12, 25), name: 'Noël' },
      ],
      notes:
        'Jours ouvrés du lundi au vendredi. Les fêtes religieuses à date mobile (Tabaski, Tamkharit, Maouloud, Magal de Touba) sont ajoutées dès leur fixation officielle.',
    },
    baseline: {
      purpose:
        "Version approuvée du modèle d'ordonnancement, qui ne change que par une demande de modification approuvée. Elle sert de base à la mesure des écarts de délai.",
      components:
        'Liste et attributs des activités, estimations des durées, liste des jalons, réseau du projet, calendrier du projet et échéancier.',
    },
  });
}

/** Dictionnaire de la WBS de démonstration « Projet Alpha » (trois lots détaillés, comme le template). */
export function buildProjectAlphaWbsDictionary(): WbsDictionary {
  return WbsDictionary.create({
    projectId: PROJECT_ID,
    entries: [
      {
        wbsCode: '1.1',
        responsibleId: PM_ID,
        description: 'Rédiger la charte du projet, la faire relire par la DSI et obtenir la signature du sponsor.',
        keyDeliverable: 'Charte du projet approuvée',
        assumptions: 'Sponsor disponible pour une revue de trente minutes.',
        milestones: [
          { name: 'Charte soumise', dueDate: d(2025, 1, 9) },
          { name: 'Charte approuvée', dueDate: d(2025, 1, 20) },
        ],
        qualityRequirements: 'Charte conforme au modèle de la DSI ; complétude vérifiée avant soumission.',
        acceptanceCriteria: 'Charte signée par le chef de projet et par le sponsor.',
        technicalInformation: "Modèle de charte de la DSI ; espace projet de l'application.",
        agreementInformation: 'Aucun contrat à ce stade.',
      },
      {
        wbsCode: '2.1',
        responsibleId: PM_ID,
        description: "Définir le champ d'application et les objectifs mesurables avec le métier.",
        keyDeliverable: 'Énoncé du périmètre',
        assumptions: 'Aucune demande de modification pendant la définition.',
        milestones: [{ name: 'Énoncé du périmètre validé', dueDate: d(2025, 2, 6) }],
        qualityRequirements: "Chaque livrable porte ses critères d'acceptation.",
        acceptanceCriteria: 'Énoncé validé par le sponsor et par les chefs de dépôt.',
        technicalInformation: "Ateliers dans les dépôts ; énoncé tenu dans l'application.",
        agreementInformation: '',
      },
      {
        wbsCode: '3.1',
        responsibleId: PM_ID,
        description: "Mettre en place le suivi hebdomadaire de l'avancement et le rapport exécutif mensuel.",
        keyDeliverable: 'Rapport exécutif mensuel',
        assumptions: "Données d'avancement transmises chaque vendredi par l'équipe et l'intégrateur.",
        milestones: [{ name: 'Premier rapport exécutif', dueDate: d(2025, 2, 28) }],
        qualityRequirements: "Données d'avancement collectées chaque vendredi.",
        acceptanceCriteria: 'Rapport validé par le sponsor au comité de pilotage.',
        technicalInformation: "Rapport exécutif de l'application ; point hebdomadaire.",
        agreementInformation: "Engagements de reporting de l'intégrateur prévus au contrat cadre.",
      },
    ],
  });
}
