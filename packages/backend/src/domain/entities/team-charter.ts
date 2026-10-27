import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export interface TeamSignature {
  /** Signataire : ressource du référentiel (identifiant). */
  resourceId: string;
  role: string;
  signedOn: Date | null;
}

export interface TeamCharterProps {
  projectId: string;
  preparedOn: Date;
  values: readonly string[];
  meetingGuidelines: readonly string[];
  communicationGuidelines: readonly string[];
  decisionMaking: string;
  conflictResolution: string;
  otherAgreements: readonly string[];
  signatures: readonly TeamSignature[];
}

function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Agrégat racine : la charte de l'équipe (template PMI) — valeurs, règles de réunion et de
 * communication, prise de décision, résolution des conflits, signatures. Une signature ne
 * peut précéder la préparation de la charte.
 */
export class TeamCharter {
  private constructor(readonly props: Readonly<TeamCharterProps>) {}

  static create(params: TeamCharterProps): TeamCharter {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation de la charte de l'équipe invalide.");
    }
    const signatures = params.signatures.map((signature, index) => {
      const resourceId = requiredText(signature.resourceId, `Choisissez le signataire n° ${index + 1} dans le référentiel des ressources.`);
      if (signature.signedOn && signature.signedOn.getTime() < params.preparedOn.getTime()) {
        throw new DomainError(`La signature n° ${index + 1} ne peut précéder la préparation de la charte.`);
      }
      return { resourceId, role: signature.role.trim(), signedOn: signature.signedOn ? new Date(signature.signedOn) : null };
    });

    return new TeamCharter(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        values: lines(params.values),
        meetingGuidelines: lines(params.meetingGuidelines),
        communicationGuidelines: lines(params.communicationGuidelines),
        decisionMaking: params.decisionMaking.trim(),
        conflictResolution: params.conflictResolution.trim(),
        otherAgreements: lines(params.otherAgreements),
        signatures,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
