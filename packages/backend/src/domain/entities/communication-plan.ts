import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export interface CommunicationItem {
  audience: string;
  information: string;
  method: string;
  frequency: string;
  /** Ressource du référentiel (identifiant). */
  senderId: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface CommunicationPlanProps {
  projectId: string;
  preparedOn: Date;
  communications: readonly CommunicationItem[];
  assumptions: readonly string[];
  constraints: readonly string[];
  glossary: readonly GlossaryEntry[];
}

function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Agrégat racine : le plan de communication (template « Communications Management Plan ») :
 * qui reçoit quelle information, comment, à quel rythme et de qui ; hypothèses, contraintes
 * et glossaire. Chaque communication est entièrement renseignée ; un terme n'est défini qu'une fois.
 */
export class CommunicationPlan {
  private constructor(readonly props: Readonly<CommunicationPlanProps>) {}

  static create(params: CommunicationPlanProps): CommunicationPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de communication invalide.');
    }

    const communications = params.communications.map((item, index) => {
      const label = `la communication n° ${index + 1}`;
      return {
        audience: requiredText(item.audience, `Indiquez le destinataire de ${label}.`),
        information: requiredText(item.information, `Indiquez l'information de ${label}.`),
        method: requiredText(item.method, `Indiquez le moyen de ${label}.`),
        frequency: requiredText(item.frequency, `Indiquez la fréquence de ${label}.`),
        senderId: requiredText(item.senderId, `Choisissez l'émetteur de ${label} dans le référentiel des ressources.`),
      };
    });

    const terms = new Set<string>();
    const glossary = params.glossary.map((entry, index) => {
      const term = requiredText(entry.term, `Le terme n° ${index + 1} du glossaire est vide.`);
      if (terms.has(term.toLowerCase())) {
        throw new DomainError(`Terme en double dans le glossaire : « ${term} ».`);
      }
      terms.add(term.toLowerCase());
      return { term, definition: requiredText(entry.definition, `Définissez le terme « ${term} ».`) };
    });

    return new CommunicationPlan(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        communications,
        assumptions: lines(params.assumptions),
        constraints: lines(params.constraints),
        glossary,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
