/**
 * Contrats du plan d'engagement des parties prenantes (PMBOK 8 : processus 14, alimenté par
 * 24 et 36) et du plan de communication (processus 15, alimenté par 25 et 37), alignés sur les
 * templates « Stakeholder Engagement Plan », « Stakeholder Engagement Assessment Matrix » et
 * « Communications Management Plan ». Dates en ISO-8601.
 */
import type { StakeholderDto } from './stakeholder-register';

/** Méthodes de communication (PMBOK) : diffusion, mise à disposition, échange interactif. */
export type CommunicationStyle = 'PUSH' | 'PULL' | 'INTERACTIVE';

export interface EngagementApproachInput {
  /** Code de la partie prenante dans le registre (ex. PP-003). */
  stakeholderCode: string;
  /** Comment faire passer l'engagement du niveau actuel au niveau souhaité. */
  approach: string;
  informationNeeds: string;
  frequency: string;
  method: string;
  styles: CommunicationStyle[];
}

export interface StakeholderEngagementPlanInput {
  preparedOn: string;
  approaches: EngagementApproachInput[];
  /** Évolutions d'engagement attendues (template « Pending Stakeholder Changes »). */
  pendingChanges: string;
  /** Relations entre parties prenantes (template « Stakeholder Relationships »). */
  relationships: string;
}

export interface StakeholderEngagementPlanDto extends StakeholderEngagementPlanInput {
  projectId: string;
  /** Parties prenantes du registre, avec leur engagement actuel et souhaité (matrice C / D). */
  stakeholders: StakeholderDto[];
  /** Codes des parties prenantes à faire progresser qui n'ont pas encore d'approche. */
  missingApproaches: string[];
}

export interface CommunicationItemInput {
  /** Partie prenante ou groupe destinataire. */
  audience: string;
  information: string;
  method: string;
  frequency: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  senderId: string;
}

export interface GlossaryEntryInput {
  term: string;
  definition: string;
}

export interface CommunicationPlanInput {
  preparedOn: string;
  communications: CommunicationItemInput[];
  assumptions: string[];
  constraints: string[];
  glossary: GlossaryEntryInput[];
}

export interface CommunicationPlanDto extends CommunicationPlanInput {
  projectId: string;
}
