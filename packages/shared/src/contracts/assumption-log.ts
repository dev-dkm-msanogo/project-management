/**
 * Contrats du registre des hypothèses et contraintes (« assumption log », PMBOK 8 : processus 1,
 * alimenté par 5, 9, 12, 17 et 38), alignés sur le template « Assumption Log ».
 * Dates transportées en chaînes ISO-8601 (YYYY-MM-DD).
 */

export type AssumptionKind = 'ASSUMPTION' | 'CONSTRAINT';

export type AssumptionCategory =
  | 'SCOPE'
  | 'SCHEDULE'
  | 'COST'
  | 'RESOURCES'
  | 'STAKEHOLDERS'
  | 'TECHNICAL'
  | 'QUALITY'
  | 'ORGANIZATIONAL'
  | 'EXTERNAL'
  | 'PROCUREMENT';

/** Hypothèse : TO_VALIDATE, VALIDATED, INVALIDATED. Contrainte : ACTIVE, LIFTED. */
export type AssumptionStatus = 'TO_VALIDATE' | 'VALIDATED' | 'INVALIDATED' | 'ACTIVE' | 'LIFTED';

export interface AssumptionEntryInput {
  code: string;
  kind: AssumptionKind;
  statement: string;
  category: AssumptionCategory;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  ownerId: string;
  /** Échéance : validation d'une hypothèse, action liée à une contrainte. */
  dueDate: string | null;
  /** Actions de validation ou de suivi. */
  actions: string | null;
  status: AssumptionStatus;
  comments: string | null;
  /** Risque du registre des risques qui porte la conséquence (ex. hypothèse invalidée). */
  riskCode: string | null;
}

/** Aucune valeur calculée : la lecture reprend la saisie. */
export type AssumptionEntryDto = AssumptionEntryInput;

export interface AssumptionLogDto {
  projectId: string;
  entries: AssumptionEntryDto[];
}

export interface AssumptionLogInput {
  entries: AssumptionEntryInput[];
}
