/**
 * Contrats des plans de gestion rédigés (PMBOK 8), alignés sur les templates PMI.
 * Un plan = une date de préparation et un texte par section ; le catalogue ci-dessous
 * fixe, pour chaque type de plan, ses sections dans l'ordre du template.
 */

export type ManagementPlanKind =
  | 'SCOPE_MANAGEMENT'
  | 'REQUIREMENTS_MANAGEMENT'
  | 'SCHEDULE_MANAGEMENT'
  | 'FINANCIAL_MANAGEMENT';

export interface PlanSectionDefinition {
  key: string;
  label: string;
  /** Ce que la section doit couvrir (aide à la rédaction). */
  hint: string;
}

export interface PlanDefinition {
  title: string;
  sections: readonly PlanSectionDefinition[];
}

/** Catalogue partagé (source unique des sections, validées par le serveur). */
export const MANAGEMENT_PLAN_CATALOG: Readonly<Record<ManagementPlanKind, PlanDefinition>> = {
  SCOPE_MANAGEMENT: {
    title: 'Plan de gestion du périmètre',
    sections: [
      { key: 'wbs', label: 'Structure de découpage du projet (WBS)', hint: 'Méthode de décomposition, livrables de niveau 1, taille des lots de travail.' },
      { key: 'wbsDictionary', label: 'Dictionnaire de la WBS', hint: 'Informations tenues pour chaque lot et responsable du dictionnaire.' },
      { key: 'baselineMaintenance', label: 'Maintien de la référence du périmètre', hint: 'Contenu de la référence, traitement des demandes de changement, approbateurs.' },
      { key: 'deliverableAcceptance', label: 'Acceptation des livrables', hint: "Étapes de vérification et d'acceptation formelle, signataires." },
      { key: 'requirementsIntegration', label: 'Intégration du périmètre et des exigences', hint: "Lien entre exigences, lots de la WBS, critères d'acceptation et tests." },
    ],
  },
  REQUIREMENTS_MANAGEMENT: {
    title: 'Plan de gestion des exigences',
    sections: [
      { key: 'collection', label: 'Recueil', hint: 'Techniques et interlocuteurs pour recueillir les exigences.' },
      { key: 'analysis', label: 'Analyse', hint: "Critères d'analyse et traitement des conflits entre besoins." },
      { key: 'categories', label: 'Catégories', hint: 'Métier, parties prenantes, fonctionnelles, non fonctionnelles, transition, projet.' },
      { key: 'documentation', label: 'Documentation', hint: 'Informations enregistrées pour chaque exigence et responsable.' },
      { key: 'prioritization', label: 'Priorisation', hint: 'Méthode (ex. MoSCoW), décideurs, révision aux jalons.' },
      { key: 'metrics', label: 'Indicateurs', hint: 'Indicateurs de qualité des exigences et cibles.' },
      { key: 'traceability', label: 'Structure de traçabilité', hint: 'Éléments auxquels chaque exigence est reliée.' },
      { key: 'tracking', label: 'Suivi', hint: 'Statuts des exigences et rythme de mise à jour.' },
      { key: 'reporting', label: 'Reporting', hint: "Où et comment l'état des exigences est rapporté." },
      { key: 'validation', label: 'Validation', hint: 'Qui valide chaque exigence, et comment.' },
      { key: 'configuration', label: 'Gestion de configuration', hint: 'Versionnement et circuit de changement des exigences approuvées.' },
    ],
  },
  SCHEDULE_MANAGEMENT: {
    title: "Plan de gestion de l'échéancier",
    sections: [
      { key: 'methodology', label: "Méthode d'ordonnancement", hint: 'Méthode (ex. chemin critique), définition et enchaînement des activités, estimation des durées.' },
      { key: 'tools', label: 'Outils de planification', hint: "Outil de référence, formats de diffusion, suivi de la disponibilité des ressources." },
      { key: 'accuracy', label: "Niveau d'exactitude", hint: 'Fourchette admise sur les durées, affinage progressif, réserve de délai.' },
      { key: 'units', label: 'Unités de mesure', hint: "Unités de durée et d'effort, calendrier de travail." },
      { key: 'varianceThresholds', label: "Seuils d'écart", hint: 'Écarts tolérés et actions ou escalades associées.' },
      { key: 'reporting', label: 'Reporting et format', hint: "Contenu et fréquence des rapports d'avancement." },
      { key: 'procedures', label: "Procédures de l'organisation", hint: 'Procédures et modèles applicables à la planification.' },
      { key: 'updates', label: "Mises à jour de l'échéancier", hint: "Collecte de l'avancement, rythme de mise à jour, modification de la référence." },
    ],
  },
  FINANCIAL_MANAGEMENT: {
    title: 'Plan de gestion financière',
    sections: [
      { key: 'unitsOfMeasure', label: 'Unités de mesure', hint: "Devise, unités d'effort et de durée, conversions." },
      { key: 'precision', label: 'Niveau de précision', hint: 'Arrondis des estimations et des totaux.' },
      { key: 'accuracy', label: "Niveau d'exactitude", hint: 'Fourchettes admises à chaque étape : ordre de grandeur, budgétaire, définitive.' },
      { key: 'fundingSources', label: 'Sources de financement', hint: 'Origine des fonds et ordonnateur du budget.' },
      { key: 'fundingFrequency', label: 'Fréquence de financement et trésorerie', hint: 'Rythme de déblocage des fonds et prévisions de trésorerie.' },
      { key: 'controlThresholds', label: 'Seuils de contrôle', hint: 'Écarts tolérés et actions ou escalades associées.' },
      { key: 'performanceRules', label: 'Règles de mesure de la performance', hint: 'Techniques de valeur acquise et indicateurs suivis.' },
      { key: 'reporting', label: 'Reporting financier', hint: 'Contenu et fréquence des rapports financiers.' },
      { key: 'reserveManagement', label: 'Gestion des réserves', hint: "Réserve pour aléas et réserve de management : détenteur et règles d'utilisation." },
      { key: 'compliance', label: 'Devise, fiscalité et conformité', hint: 'Change, conditions de paiement, marchés, conservation des pièces.' },
      { key: 'procedures', label: "Procédures de l'organisation", hint: 'Procédures financières applicables, codification analytique.' },
    ],
  },
};

export interface ManagementPlanInput {
  preparedOn: string;
  /** Texte de chaque section, par clé du catalogue. */
  sections: Record<string, string>;
}

/** Plans rédigés d'un projet, par type (un type absent n'a pas encore été rédigé). */
export interface ManagementPlansInput {
  plans: Partial<Record<ManagementPlanKind, ManagementPlanInput>>;
}

export interface ManagementPlansDto extends ManagementPlansInput {
  projectId: string;
}
