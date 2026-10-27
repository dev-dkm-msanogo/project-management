/**
 * Modèle de navigation aligné sur le PMBOK 8.
 *
 * - Les 40 processus (numérotés dans l'ordre du cycle de vie) servent de référence de traçabilité.
 * - Le menu liste les OUTPUTS (livrables / artefacts) : chacun déclare les processus qui le
 *   produisent et ceux qui l'alimentent ensuite. Son groupe de processus se déduit de son
 *   premier processus producteur.
 *
 * Sources des 40 processus (secondaires, à valider sur le texte officiel du PMI) :
 * projecttogetheroffice.com/pmbok-8-focus-areas et mypreppilot.com — mêmes 40 intitulés.
 * Seule divergence : « Identify Stakeholders », classé ici en Démarrage (2 / 19 / 8 / 10 / 1).
 * Intitulés traduits en français (traduction de travail, pas la version française officielle).
 */

/** Vues effectivement disponibles dans l'application. */
export type AppView =
  | 'projects'
  | 'my-tasks'
  | 'approvals'
  | 'audit'
  | 'resource-directory'
  | 'users'
  | 'account'
  | 'business-case'
  | 'benefits'
  | 'charter'
  | 'assumptions'
  | 'raci'
  | 'stakeholder-questionnaire'
  | 'stakeholders'
  | 'stakeholder-analysis'
  | 'stakeholder-mapping'
  | 'scope-plan'
  | 'requirements-plan'
  | 'requirements'
  | 'scope-statement'
  | 'schedule-plan'
  | 'schedule-activities'
  | 'schedule-network'
  | 'schedule-milestones'
  | 'schedule-baseline'
  | 'quality-plan'
  | 'quality-metrics'
  | 'quality-report'
  | 'quality-analyses'
  | 'risk-plan'
  | 'financial-plan'
  | 'cost-estimates'
  | 'cost-baseline'
  | 'funding-strategy'
  | 'funding-requirements'
  | 'resource-plan'
  | 'resource-requirements'
  | 'team-charter'
  | 'engagement-plan'
  | 'communication-plan'
  | 'procurement-plan'
  | 'procurement-strategy'
  | 'source-selection'
  | 'project-management-plan'
  | 'change-log'
  | 'issue-log'
  | 'lessons-learned'
  | 'report'
  | 'wbs'
  | 'wbs-dictionary'
  | 'gantt'
  | 'risks'
  | 'task-progress'
  | 'actual-costs'
  | 'earned-value';

/** Vues hors livrables PMBOK : portefeuille, administration, compte. */
export type StandaloneView =
  | 'projects'
  | 'my-tasks'
  | 'approvals'
  | 'audit'
  | 'resource-directory'
  | 'users'
  | 'account';

/** Vues qui outillent un livrable du menu. */
export type OutputView = Exclude<AppView, StandaloneView>;

export const STANDALONE_VIEWS: Record<StandaloneView, { title: string; section: string }> = {
  projects: { title: 'Tableau de bord du portefeuille', section: 'Portefeuille' },
  'my-tasks': { title: 'Mes tâches', section: 'Portefeuille' },
  approvals: { title: 'Validations', section: 'Portefeuille' },
  audit: { title: "Journal d'audit", section: 'Administration' },
  'resource-directory': { title: 'Référentiel des ressources', section: 'Organisation' },
  users: { title: 'Utilisateurs', section: 'Administration' },
  account: { title: 'Mon compte', section: 'Compte' },
};

export type ProcessGroupId = 'initiating' | 'planning' | 'executing' | 'monitoring' | 'closing';

export interface ProcessGroup {
  id: ProcessGroupId;
  number: number;
  label: string;
  /** Couleur de la charte graphique, et couleur du numéro posé dessus (contraste AA). */
  color: string;
  ink: string;
}

export const PROCESS_GROUPS: readonly ProcessGroup[] = [
  { id: 'initiating', number: 1, label: 'Démarrage', color: '#135585', ink: '#ffffff' },
  { id: 'planning', number: 2, label: 'Planification', color: '#00884b', ink: '#ffffff' },
  { id: 'executing', number: 3, label: 'Exécution', color: '#ffcf00', ink: '#3f3f3e' },
  { id: 'monitoring', number: 4, label: 'Surveillance et maîtrise', color: '#c64d27', ink: '#ffffff' },
  { id: 'closing', number: 5, label: 'Clôture', color: '#3f3f3e', ink: '#ffffff' },
];

export interface PmbokProcess {
  number: number;
  label: string;
  group: ProcessGroupId;
}

export const PMBOK8_PROCESSES: readonly PmbokProcess[] = [
  // Démarrage (2)
  { number: 1, label: 'Démarrer le projet ou la phase', group: 'initiating' },
  { number: 2, label: 'Identifier les parties prenantes', group: 'initiating' },
  // Planification (19)
  { number: 3, label: 'Planifier la gestion du périmètre', group: 'planning' },
  { number: 4, label: 'Recueillir et analyser les exigences', group: 'planning' },
  { number: 5, label: 'Définir le périmètre', group: 'planning' },
  { number: 6, label: 'Élaborer la structure du périmètre', group: 'planning' },
  { number: 7, label: "Planifier la gestion de l'échéancier", group: 'planning' },
  { number: 8, label: 'Estimer les ressources', group: 'planning' },
  { number: 9, label: "Élaborer l'échéancier", group: 'planning' },
  { number: 10, label: 'Planifier la gestion financière', group: 'planning' },
  { number: 11, label: 'Estimer les coûts', group: 'planning' },
  { number: 12, label: 'Établir le budget', group: 'planning' },
  { number: 13, label: 'Planifier la gestion des ressources', group: 'planning' },
  { number: 14, label: "Planifier l'engagement des parties prenantes", group: 'planning' },
  { number: 15, label: 'Planifier la gestion des communications', group: 'planning' },
  { number: 16, label: 'Planifier la gestion des risques', group: 'planning' },
  { number: 17, label: 'Identifier les risques', group: 'planning' },
  { number: 18, label: 'Analyser les risques', group: 'planning' },
  { number: 19, label: 'Planifier les réponses aux risques', group: 'planning' },
  { number: 20, label: "Planifier la stratégie d'approvisionnement", group: 'planning' },
  { number: 21, label: 'Intégrer et aligner les plans du projet', group: 'planning' },
  // Exécution (8)
  { number: 22, label: 'Obtenir les ressources', group: 'executing' },
  { number: 23, label: "Diriger l'équipe", group: 'executing' },
  { number: 24, label: "Gérer l'engagement des parties prenantes", group: 'executing' },
  { number: 25, label: 'Gérer les communications', group: 'executing' },
  { number: 26, label: "Gérer l'assurance qualité", group: 'executing' },
  { number: 27, label: "Gérer l'exécution du projet", group: 'executing' },
  { number: 28, label: 'Gérer les connaissances du projet', group: 'executing' },
  { number: 29, label: 'Mettre en œuvre les réponses aux risques', group: 'executing' },
  // Surveillance et maîtrise (10)
  { number: 30, label: 'Surveiller et maîtriser la performance du projet', group: 'monitoring' },
  { number: 31, label: 'Surveiller et maîtriser le périmètre', group: 'monitoring' },
  { number: 32, label: 'Valider le périmètre', group: 'monitoring' },
  { number: 33, label: "Surveiller et maîtriser l'échéancier", group: 'monitoring' },
  { number: 34, label: 'Surveiller et maîtriser les finances', group: 'monitoring' },
  { number: 35, label: 'Surveiller et maîtriser les ressources', group: 'monitoring' },
  { number: 36, label: "Surveiller l'engagement des parties prenantes", group: 'monitoring' },
  { number: 37, label: 'Surveiller les communications', group: 'monitoring' },
  { number: 38, label: 'Surveiller les risques', group: 'monitoring' },
  { number: 39, label: 'Évaluer et mettre en œuvre les changements', group: 'monitoring' },
  // Clôture (1)
  { number: 40, label: 'Clore le projet ou la phase', group: 'closing' },
];

export interface PmbokOutput {
  id: string;
  label: string;
  /** Processus qui produisent l'output (le premier détermine son groupe). */
  produced: readonly number[];
  /** Processus qui l'alimentent ou le mettent à jour ensuite. */
  fedBy: readonly number[];
  /** Vue de l'application qui outille l'output (absent : pas encore outillé). */
  view?: OutputView;
}

// Déclarés dans l'ordre du cycle de vie.
export const PMBOK8_OUTPUTS: readonly PmbokOutput[] = [
  // Démarrage
  { id: 'business-case', label: 'Business case', produced: [1], fedBy: [], view: 'business-case' },
  { id: 'benefits-plan', label: 'Plan de gestion des bénéfices', produced: [1], fedBy: [30, 40], view: 'benefits' },
  { id: 'charter', label: 'Charte du projet', produced: [1], fedBy: [], view: 'charter' },
  {
    id: 'assumption-log',
    label: 'Hypothèses et contraintes',
    produced: [1],
    fedBy: [5, 9, 12, 17, 38],
    view: 'assumptions',
  },
  { id: 'raci', label: 'Matrice RACI', produced: [1], fedBy: [13, 22, 23], view: 'raci' },
  {
    id: 'stakeholder-questionnaire',
    label: "Questionnaire d'identification",
    produced: [2],
    fedBy: [],
    view: 'stakeholder-questionnaire',
  },
  {
    id: 'stakeholder-register',
    label: 'Registre des parties prenantes',
    produced: [2],
    fedBy: [14, 24, 36],
    view: 'stakeholders',
  },
  {
    id: 'stakeholder-analysis',
    label: 'Analyse des parties prenantes',
    produced: [2],
    fedBy: [14, 36],
    view: 'stakeholder-analysis',
  },
  {
    id: 'stakeholder-mapping',
    label: 'Cartographie des parties prenantes',
    produced: [2],
    fedBy: [14, 36],
    view: 'stakeholder-mapping',
  },
  // Planification
  { id: 'scope-management-plan', label: 'Plan de gestion du périmètre', produced: [3], fedBy: [], view: 'scope-plan' },
  {
    id: 'requirements-management-plan',
    label: 'Plan de gestion des exigences',
    produced: [3],
    fedBy: [],
    view: 'requirements-plan',
  },
  { id: 'requirements', label: 'Exigences et traçabilité', produced: [4], fedBy: [31, 32], view: 'requirements' },
  { id: 'scope-statement', label: 'Énoncé du périmètre', produced: [5], fedBy: [31], view: 'scope-statement' },
  { id: 'wbs', label: 'Structure (WBS)', produced: [6], fedBy: [31], view: 'wbs' },
  { id: 'wbs-dictionary', label: 'Dictionnaire de la WBS', produced: [6], fedBy: [31], view: 'wbs-dictionary' },
  {
    id: 'schedule-management-plan',
    label: "Plan de gestion de l'échéancier",
    produced: [7],
    fedBy: [],
    view: 'schedule-plan',
  },
  { id: 'activity-list', label: 'Activités et durées', produced: [9], fedBy: [33], view: 'schedule-activities' },
  { id: 'network-diagram', label: 'Réseau du projet', produced: [9], fedBy: [33], view: 'schedule-network' },
  { id: 'milestone-list', label: 'Jalons et calendrier', produced: [9], fedBy: [33], view: 'schedule-milestones' },
  { id: 'schedule', label: 'Échéancier (Gantt)', produced: [9], fedBy: [33], view: 'gantt' },
  {
    id: 'schedule-baseline',
    label: "Référence de l'échéancier",
    produced: [9],
    fedBy: [39],
    view: 'schedule-baseline',
  },
  { id: 'financial-management-plan', label: 'Plan de gestion financière', produced: [10], fedBy: [], view: 'financial-plan' },
  { id: 'funding-strategy', label: 'Stratégie de financement', produced: [10], fedBy: [], view: 'funding-strategy' },
  { id: 'cost-estimates', label: 'Estimations des coûts', produced: [11], fedBy: [34], view: 'cost-estimates' },
  { id: 'cost-baseline', label: 'Référence des coûts', produced: [12], fedBy: [34, 39], view: 'cost-baseline' },
  {
    id: 'funding-requirements',
    label: 'Besoins de financement',
    produced: [12],
    fedBy: [34],
    view: 'funding-requirements',
  },
  { id: 'resource-management-plan', label: 'Plan de gestion des ressources', produced: [13], fedBy: [35], view: 'resource-plan' },
  { id: 'resource-requirements', label: 'Besoins en ressources', produced: [8], fedBy: [35], view: 'resource-requirements' },
  { id: 'team-charter', label: "Charte de l'équipe", produced: [13], fedBy: [23], view: 'team-charter' },
  { id: 'risk-management-plan', label: 'Plan de gestion des risques', produced: [16], fedBy: [], view: 'risk-plan' },
  { id: 'risk-register', label: 'Registre des risques', produced: [17, 18, 19], fedBy: [29, 38], view: 'risks' },
  {
    id: 'stakeholder-engagement-plan',
    label: "Plan d'engagement des parties prenantes",
    produced: [14],
    fedBy: [24, 36],
    view: 'engagement-plan',
  },
  { id: 'communications-plan', label: 'Plan de communication', produced: [15], fedBy: [25, 37], view: 'communication-plan' },
  {
    id: 'procurement-management-plan',
    label: 'Plan de gestion des approvisionnements',
    produced: [20],
    fedBy: [],
    view: 'procurement-plan',
  },
  {
    id: 'sourcing-strategy',
    label: "Stratégie d'approvisionnement",
    produced: [20],
    fedBy: [],
    view: 'procurement-strategy',
  },
  { id: 'source-selection', label: 'Sélection des fournisseurs', produced: [20], fedBy: [27], view: 'source-selection' },
  {
    id: 'project-plan',
    label: 'Plan de management du projet',
    produced: [21],
    fedBy: [39],
    view: 'project-management-plan',
  },
  // Exécution
  { id: 'deliverables', label: 'Livrables', produced: [27], fedBy: [32] },
  { id: 'team', label: 'Équipe et affectations', produced: [22], fedBy: [23] },
  { id: 'issue-log', label: 'Journal des problèmes', produced: [27], fedBy: [30], view: 'issue-log' },
  {
    id: 'work-performance-data',
    label: 'Avancement des tâches',
    produced: [27],
    fedBy: [23, 33],
    view: 'task-progress',
  },
  { id: 'actual-costs', label: 'Dépenses réelles', produced: [27], fedBy: [34], view: 'actual-costs' },
  {
    id: 'quality-management-plan',
    label: 'Plan de gestion de la qualité',
    produced: [26],
    fedBy: [],
    view: 'quality-plan',
  },
  { id: 'quality-metrics', label: 'Métriques qualité', produced: [26], fedBy: [], view: 'quality-metrics' },
  { id: 'quality-reports', label: 'Rapport qualité', produced: [26], fedBy: [], view: 'quality-report' },
  {
    id: 'quality-analyses',
    label: "Outils d'analyse qualité",
    produced: [26],
    fedBy: [],
    view: 'quality-analyses',
  },
  {
    id: 'lessons-learned',
    label: 'Registre des leçons apprises',
    produced: [28],
    fedBy: [40],
    view: 'lessons-learned',
  },
  // Surveillance et maîtrise
  {
    id: 'work-performance-information',
    label: 'Valeur acquise',
    produced: [30],
    fedBy: [33, 34],
    view: 'earned-value',
  },
  { id: 'report', label: 'Rapport exécutif', produced: [30], fedBy: [31, 33, 34, 38, 39], view: 'report' },
  { id: 'change-log', label: 'Registre des modifications', produced: [39], fedBy: [], view: 'change-log' },
  // Clôture
  { id: 'closure-report', label: 'Rapport de clôture', produced: [40], fedBy: [] },
];

export function processByNumber(number: number): PmbokProcess {
  return PMBOK8_PROCESSES.find((process) => process.number === number)!;
}

export function processGroup(id: ProcessGroupId): ProcessGroup {
  return PROCESS_GROUPS.find((group) => group.id === id)!;
}

/** Groupe d'un output : celui de son premier processus producteur. */
export function outputGroup(output: PmbokOutput): ProcessGroupId {
  return processByNumber(output.produced[0]!).group;
}

export interface NavSection extends ProcessGroup {
  outputs: PmbokOutput[];
}

/** Groupes de processus avec leurs outputs, dans l'ordre du cycle de vie. */
export function navSections(): NavSection[] {
  return PROCESS_GROUPS.map((group) => ({
    ...group,
    outputs: PMBOK8_OUTPUTS.filter((output) => outputGroup(output) === group.id),
  }));
}

/** Sous-titre de chaque page (en-tête de page). */
export const VIEW_DESCRIPTIONS: Record<AppView, string> = {
  projects:
    'Santé, avancement, délais, coûts et alertes de chaque projet ; ouvrez-en un ou créez-en un nouveau.',
  'my-tasks': 'Les tâches qui vous sont affectées, tous projets confondus : mettez à jour leur avancement.',
  approvals:
    "Ce qui attend votre décision, puis l'état de validation des documents du projet et ses valideurs.",
  audit: "Qui a fait quoi, et quand, dans toute la plateforme : connexions, comptes, référentiel et tous les projets.",
  'task-progress':
    'Avancement de chaque tâche : statut, pourcentage réalisé et dates réelles, saisis par la personne affectée.',
  'actual-costs': 'Ce que le projet a réellement coûté, dépense par dépense, imputé aux éléments de la WBS.',
  'earned-value':
    "Prévu, réalisé et dépensé à la date d'état : indices de délai et de coût, projection à l'achèvement.",
  'resource-directory':
    "Personnes et prestataires mobilisables par les projets : fonction, service ou entreprise et compétences.",
  users: "Comptes d'accès à la plateforme : création, rôle, activation et réinitialisation du mot de passe.",
  account: 'Votre profil et votre mot de passe.',
  'business-case':
    'Justification économique du projet : besoin, alternatives étudiées, solution recommandée, coûts et bénéfices sur trois ans.',
  benefits: 'Bénéfices attendus, calendrier de réalisation, indicateurs mesurables et responsables.',
  raci: 'Pour chaque activité : qui réalise, qui rend compte, qui est consulté et qui est informé.',
  charter:
    'Autorisation formelle du projet : objectifs mesurables, périmètre, budget, jalons et gouvernance.',
  assumptions:
    'Ce que le projet tient pour vrai sans preuve, et les limites qui lui sont imposées : à valider et à suivre.',
  'stakeholder-questionnaire':
    'Quatorze questions pour faire émerger toutes les personnes et instances qui affectent le projet ou en sont affectées.',
  'stakeholder-analysis': "Intérêt, influence et attitude de chaque partie prenante, tirés du registre.",
  'stakeholder-mapping':
    "Priorité de chaque partie prenante selon son pouvoir, son urgence et sa légitimité, et direction de son influence.",
  stakeholders:
    "Qui influence ou est concerné par le projet : pouvoir, intérêt et niveau d'engagement à atteindre.",
  'scope-plan': 'Comment le périmètre est découpé, maintenu, vérifié et accepté tout au long du projet.',
  'requirements-plan': 'Comment les exigences sont recueillies, priorisées, suivies, validées et tracées.',
  requirements:
    "Exigences du projet et du produit : priorité, critères d'acceptation, vérification et traçabilité jusqu'aux livrables.",
  'scope-statement':
    "Ce que le projet livre et ce qu'il exclut : livrables, critères d'acceptation, contraintes et hypothèses.",
  'schedule-plan':
    "Comment l'échéancier est construit, mesuré, mis à jour et rapporté : méthode, outils, unités et seuils d'écart.",
  'schedule-activities':
    "Activités à réaliser, leurs attributs et l'estimation de leur durée : méthode analogue, paramétrique ou à trois points.",
  'schedule-network':
    'Enchaînement des activités, dates au plus tôt et au plus tard, marges et chemin critique, calculés sur le calendrier du projet.',
  'schedule-milestones': 'Jalons majeurs et revues de phase, jours ouvrés et jours fériés du projet.',
  'schedule-baseline':
    "Version approuvée de l'échéancier, base de mesure des écarts de délai : composants, dates clés et approbations.",
  'quality-metrics': 'Ce que le projet mesure pour juger de sa qualité : métrique, méthode de mesure et cible.',
  'quality-report':
    "Où en est chaque métrique sur la période, anomalies ouvertes, recommandations et constats d'audit.",
  'quality-analyses': "Diagramme d'affinités, analyses des causes et effets, et logigrammes des processus.",
  'quality-plan':
    'Normes applicables, objectifs qualité mesurables, rôles, livrables et processus revus, assurance et contrôle de la qualité.',
  'risk-plan':
    "Comment les risques sont identifiés, évalués et suivis : rôles, catégories, réserve, tolérances, échelles de probabilité et d'impact.",
  'financial-plan': 'Comment les coûts sont estimés, financés, suivis, contrôlés et rapportés.',
  'cost-estimates':
    "Coût de chaque activité, méthode et fiabilité de l'estimation, réserves et financement total requis.",
  'cost-baseline': "Budget réparti dans le temps selon l'échéancier : valeur planifiée par mois et courbe en S.",
  'funding-strategy':
    "D'où viennent les fonds, quand ils sont débloqués et à quelles conditions, leur répartition et les risques de financement.",
  'funding-requirements':
    'Fonds à mettre à disposition tranche par tranche face à la dépense prévue, réserve de management et financement total requis.',
  'resource-plan':
    "Rôles, responsabilités et autorité, organisation de l'équipe, acquisition et gestion des ressources.",
  'resource-requirements':
    'Personnes et ressources physiques nécessaires, leur découpage (RBS) et la base de leur estimation.',
  'team-charter': "Valeurs, règles de fonctionnement, prise de décision et résolution des conflits, signées par l'équipe.",
  'engagement-plan':
    'Engagement actuel et souhaité de chaque partie prenante, et comment le faire progresser.',
  'communication-plan': 'Qui reçoit quelle information, par quel moyen, à quel rythme et de qui.',
  'procurement-plan':
    "Comment les achats du projet sont planifiés, conduits et suivis : calendrier, rôles, indicateurs et fournisseurs présélectionnés.",
  'procurement-strategy':
    "Ce que le projet fait ou achète, comment c'est livré, avec quels types de contrat et selon quel cycle d'achat.",
  'lessons-learned':
    "Ce que le projet a appris, situation par situation, et les pratiques récurrentes à ériger en standard de l'organisation.",
  'issue-log':
    'Problèmes rencontrés en cours de projet : priorité, impact sur les objectifs, responsable, résolution et liens vers les risques et modifications.',
  'change-log':
    "Demandes de modification de la soumission à la décision : impacts, évaluation des alternatives, décision et réserve pour aléas consommée.",
  'project-management-plan':
    'Plans de gestion et références de base réunis, cycle de vie, approche de développement, gestion des modifications et de la configuration.',
  'source-selection': "Évaluation des offres par achat : critères pondérés, notes de 1 à 5 et fournisseur recommandé.",
  report: 'Statut du projet en une page pour la gouvernance : santé, jalons, coûts, risques et décisions.',
  wbs: 'Découpage hiérarchique du travail en livrables et en lots de travaux.',
  'wbs-dictionary':
    "Fiche de chaque élément de la WBS : travail, responsable, livrable, jalons, critères d'acceptation, effort et coûts rattachés.",
  gantt: 'Échéancier des tâches et des jalons, du démarrage à la clôture.',
  risks: 'Identification, évaluation probabilité × impact, réponses et suivi des risques du projet.',
};

export function outputForView(view: AppView): PmbokOutput | undefined {
  return PMBOK8_OUTPUTS.find((output) => output.view === view);
}

/** Processus non rattachés à un output (doit rester vide : contrôle de complétude). */
export function uncoveredProcesses(): number[] {
  const covered = new Set(PMBOK8_OUTPUTS.flatMap((output) => [...output.produced, ...output.fedBy]));
  return PMBOK8_PROCESSES.map((process) => process.number).filter((number) => !covered.has(number));
}

/** Titre d'une vue : livrable du menu ou vue hors livrables. */
export function viewTitle(view: AppView): string {
  return outputForView(view)?.label ?? STANDALONE_VIEWS[view as StandaloneView].title;
}
