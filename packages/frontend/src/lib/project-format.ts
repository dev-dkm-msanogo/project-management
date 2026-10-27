import type { ProjectMethodology, ProjectStatus } from '@shared/index';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Actif',
  ON_HOLD: 'En pause',
  CLOSED: 'Clôturé',
};

export const PROJECT_STATUS_MODIFIERS: Record<ProjectStatus, 'green' | 'amber' | 'grey'> = {
  ACTIVE: 'green',
  ON_HOLD: 'amber',
  CLOSED: 'grey',
};

export const METHODOLOGY_LABELS: Record<ProjectMethodology, string> = {
  PREDICTIVE: 'Prédictive',
  HYBRID: 'Hybride',
  ADAPTIVE: 'Agile',
};

export const METHODOLOGY_HINTS: Record<ProjectMethodology, string> = {
  PREDICTIVE: 'Périmètre, délais et coûts fixés en amont : WBS, échéancier et valeur acquise.',
  HYBRID: "Gouvernance prédictive, réalisation itérative : la WBS et l'échéancier, plus le carnet de produit et les itérations.",
  ADAPTIVE: 'Livraisons par itérations courtes, besoins précisés en cours de route : carnet de produit, itérations, vélocité.',
};
