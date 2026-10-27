import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';
import { WbsCode } from '@domain/value-objects/wbs-code';

export interface WbsDictionaryEntry {
  wbsCode: string;
  /** Ressource du référentiel (identifiant). */
  responsibleId: string;
  description: string;
  keyDeliverable: string;
  assumptions: string;
  milestones: readonly { name: string; dueDate: Date }[];
  qualityRequirements: string;
  acceptanceCriteria: string;
  technicalInformation: string;
  agreementInformation: string;
}

/**
 * Agrégat racine : le dictionnaire de la WBS (template « WBS Dictionary »), une fiche par élément
 * de la WBS de l'échéancier ; fiches uniques par code. Vide : valide.
 */
export class WbsDictionary {
  private constructor(
    public readonly projectId: string,
    public readonly entries: readonly WbsDictionaryEntry[],
  ) {}

  static create(params: { projectId: string; entries: readonly WbsDictionaryEntry[] }): WbsDictionary {
    assertProjectId(params.projectId);
    const codes = new Set<string>();
    const entries = params.entries
      .map((entry) => {
        const wbsCode = WbsCode.of(entry.wbsCode).value;
        if (codes.has(wbsCode)) throw new DomainError(`Fiche en double pour l'élément ${wbsCode}.`);
        codes.add(wbsCode);
        return {
          wbsCode,
          responsibleId: requiredText(entry.responsibleId, `${wbsCode} : choisissez le responsable dans le référentiel des ressources.`),
          description: requiredText(entry.description, `${wbsCode} : décrivez le travail.`),
          keyDeliverable: entry.keyDeliverable.trim(),
          assumptions: entry.assumptions.trim(),
          milestones: entry.milestones.map((milestone, index) => {
            if (Number.isNaN(milestone.dueDate.getTime())) {
              throw new DomainError(`${wbsCode} : date invalide pour le jalon n° ${index + 1}.`);
            }
            return {
              name: requiredText(milestone.name, `${wbsCode} : nommez le jalon n° ${index + 1}.`),
              dueDate: new Date(milestone.dueDate),
            };
          }),
          qualityRequirements: entry.qualityRequirements.trim(),
          acceptanceCriteria: entry.acceptanceCriteria.trim(),
          technicalInformation: entry.technicalInformation.trim(),
          agreementInformation: entry.agreementInformation.trim(),
        };
      })
      .sort((a, b) => compareWbs(a.wbsCode, b.wbsCode));
    return new WbsDictionary(params.projectId, entries);
  }

  static empty(projectId: string): WbsDictionary {
    return WbsDictionary.create({ projectId, entries: [] });
  }
}

/** Ordre de la WBS : 1.2 < 1.10 < 2. */
export function compareWbs(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? -1) - (right[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return 0;
}
