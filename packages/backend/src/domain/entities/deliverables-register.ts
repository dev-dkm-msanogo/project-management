import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const ACCEPTANCE_DECISIONS = ['ACCEPTED', 'REJECTED'] as const;
export type AcceptanceDecision = (typeof ACCEPTANCE_DECISIONS)[number];

export interface DeliverableVerification {
  verifiedOn: Date;
  /** Ressource du référentiel (identifiant). */
  verifiedById: string;
  notes: string;
}

export interface DeliverableAcceptance {
  decision: AcceptanceDecision;
  decidedOn: Date;
  /** Ressource du référentiel (identifiant). */
  decidedById: string;
  comments: string;
  changeCode: string | null;
}

export interface DeliverableRecordProps {
  wbsCode: string;
  verification: DeliverableVerification | null;
  acceptance: DeliverableAcceptance | null;
}

const validDate = (date: Date) => !Number.isNaN(date.getTime());

/**
 * Suivi d'un livrable : vérifié (contrôle qualité), puis accepté ou refusé. On ne décide que sur un
 * livrable vérifié, jamais avant sa vérification ; un refus porte son motif.
 */
export class DeliverableRecord {
  private constructor(readonly props: Readonly<DeliverableRecordProps>) {}

  static create(params: DeliverableRecordProps): DeliverableRecord {
    const wbsCode = requiredText(params.wbsCode, "Livrable : choisissez l'élément de la WBS.");
    const { verification, acceptance } = params;
    if (verification && !validDate(verification.verifiedOn)) {
      throw new DomainError(`Livrable ${wbsCode} : date de vérification invalide.`);
    }
    if (acceptance) {
      if (!verification) {
        throw new DomainError(`Livrable ${wbsCode} : vérifiez le livrable avant de décider de son acceptation.`);
      }
      if (!validDate(acceptance.decidedOn)) {
        throw new DomainError(`Livrable ${wbsCode} : date de décision invalide.`);
      }
      if (acceptance.decidedOn.getTime() < verification.verifiedOn.getTime()) {
        throw new DomainError(`Livrable ${wbsCode} : la décision ne peut précéder la vérification.`);
      }
    }

    return new DeliverableRecord(
      Object.freeze({
        wbsCode,
        verification: verification && {
          verifiedOn: new Date(verification.verifiedOn),
          verifiedById: requiredText(
            verification.verifiedById,
            `Livrable ${wbsCode} : choisissez qui l'a vérifié dans le référentiel des ressources.`,
          ),
          notes: verification.notes.trim(),
        },
        acceptance: acceptance && {
          decision: acceptance.decision,
          decidedOn: new Date(acceptance.decidedOn),
          decidedById: requiredText(
            acceptance.decidedById,
            `Livrable ${wbsCode} : choisissez qui a décidé dans le référentiel des ressources.`,
          ),
          comments:
            acceptance.decision === 'REJECTED'
              ? requiredText(acceptance.comments, `Livrable ${wbsCode} : indiquez le motif du refus.`)
              : acceptance.comments.trim(),
          changeCode: acceptance.changeCode?.trim() ? entryCode(acceptance.changeCode, 'de demande de modification liée') : null,
        },
      }),
    );
  }

  get wbsCode(): string {
    return this.props.wbsCode;
  }
}

/**
 * Agrégat racine : le registre des livrables d'un projet, un suivi par élément de la WBS. Un
 * élément sans vérification ni décision n'a rien à consigner : il n'est pas conservé.
 */
export class DeliverablesRegister {
  private constructor(
    public readonly projectId: string,
    public readonly records: readonly DeliverableRecord[],
  ) {}

  static create(params: { projectId: string; records: readonly DeliverableRecord[] }): DeliverablesRegister {
    assertProjectId(params.projectId);
    const seen = new Set<string>();
    for (const record of params.records) {
      if (seen.has(record.wbsCode)) {
        throw new DomainError(`Livrable ${record.wbsCode} suivi deux fois.`);
      }
      seen.add(record.wbsCode);
    }
    const kept = params.records.filter((record) => record.props.verification || record.props.acceptance);
    return new DeliverablesRegister(params.projectId, kept);
  }

  static empty(projectId: string): DeliverablesRegister {
    return DeliverablesRegister.create({ projectId, records: [] });
  }

  recordOf(wbsCode: string): DeliverableRecord | undefined {
    return this.records.find((record) => record.wbsCode === wbsCode);
  }

  /** Demandes de modification citées, absentes du registre des modifications (sans casse). */
  unknownChangeCodes(knownChangeCodes: readonly string[]): string[] {
    const known = new Set(knownChangeCodes.map((code) => code.toUpperCase()));
    return this.records
      .map((record) => record.props.acceptance?.changeCode ?? null)
      .filter((code): code is string => code !== null && !known.has(code.toUpperCase()));
  }
}
