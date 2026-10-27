import { DomainError } from '@domain/errors/domain-errors';
import {
  assertProjectId,
  assertUniqueCodes,
  assertUniqueNames,
  entryCode,
  requiredText,
} from '@domain/value-objects/register-rules';

export interface AffinityGroup {
  theme: string;
  ideas: readonly string[];
}

export interface AffinityDiagram {
  question: string;
  groups: readonly AffinityGroup[];
}

export interface CauseCategory {
  name: string;
  causes: readonly string[];
}

export interface CauseEffect {
  code: string;
  effect: string;
  categories: readonly CauseCategory[];
}

export const FLOW_STEP_KINDS = ['START', 'ACTION', 'DECISION', 'END'] as const;
export type FlowStepKind = (typeof FLOW_STEP_KINDS)[number];

export interface FlowStep {
  code: string;
  kind: FlowStepKind;
  label: string;
  noTarget: string | null;
  noLabel: string;
}

export interface Flowchart {
  code: string;
  name: string;
  description: string;
  steps: readonly FlowStep[];
}

export interface QualityAnalysesProps {
  projectId: string;
  preparedOn: Date;
  affinity: AffinityDiagram;
  causeEffects: readonly CauseEffect[];
  flowcharts: readonly Flowchart[];
}

/** Libellés non vides, uniques sans casse (idées d'un thème, causes d'une catégorie). */
function items(values: readonly string[], context: string, what: string): string[] {
  const kept = values.map((value) => requiredText(value, `${context} : ${what} vide.`));
  assertUniqueNames(kept, (value) => `${context} : « ${value} » figure deux fois.`);
  if (kept.length === 0) throw new DomainError(`${context} : au moins une entrée attendue.`);
  return kept;
}

function affinityOf(diagram: AffinityDiagram): AffinityDiagram {
  const groups = diagram.groups.map((group) => {
    const theme = requiredText(group.theme, "Diagramme d'affinités : nommez chaque thème.");
    return { theme, ideas: items(group.ideas, `Thème « ${theme} »`, 'idée') };
  });
  assertUniqueNames(groups.map((group) => group.theme), (theme) => `Le thème « ${theme} » figure deux fois.`);
  return { question: diagram.question.trim(), groups };
}

function causeEffectOf(analysis: CauseEffect): CauseEffect {
  const code = entryCode(analysis.code, "d'analyse des causes");
  const categories = analysis.categories.map((category) => {
    const name = requiredText(category.name, `${code} : nommez chaque catégorie de causes.`);
    return { name, causes: items(category.causes, `${code}, catégorie « ${name} »`, 'cause') };
  });
  assertUniqueNames(categories.map((category) => category.name), (name) => `${code} : la catégorie « ${name} » figure deux fois.`);
  if (categories.length === 0) throw new DomainError(`${code} : au moins une catégorie de causes attendue.`);
  return { code, effect: requiredText(analysis.effect, `${code} : décrivez l'effet analysé.`), categories };
}

/** Logigramme : un début en tête, une fin en dernier ; « Non » d'une décision mène à une autre étape ou à une issue décrite. */
function flowchartOf(flowchart: Flowchart): Flowchart {
  const code = entryCode(flowchart.code, 'de logigramme');
  const steps = flowchart.steps.map((step) => {
    const stepCode = entryCode(step.code, `d'étape (${code})`);
    if (!(FLOW_STEP_KINDS as readonly string[]).includes(step.kind)) {
      throw new DomainError(`${code}, ${stepCode} : type d'étape invalide.`);
    }
    return {
      code: stepCode,
      kind: step.kind,
      label: requiredText(step.label, `${code}, ${stepCode} : libellé requis.`),
      noTarget: step.kind === 'DECISION' && step.noTarget?.trim() ? step.noTarget.trim() : null,
      noLabel: step.kind === 'DECISION' ? step.noLabel.trim() : '',
    };
  });
  assertUniqueCodes(steps, `d'étape (${code})`);
  if (steps.length < 2 || steps[0]!.kind !== 'START' || steps.at(-1)!.kind !== 'END') {
    throw new DomainError(`${code} : le logigramme commence par un début et se termine par une fin.`);
  }
  if (steps.slice(1, -1).some((step) => step.kind === 'START' || step.kind === 'END')) {
    throw new DomainError(`${code} : un seul début et une seule fin.`);
  }
  for (const step of steps.filter((item) => item.kind === 'DECISION')) {
    if (step.noTarget === null) {
      if (!step.noLabel) throw new DomainError(`${code}, ${step.code} : indiquez où mène « Non ».`);
      continue;
    }
    const target = steps.find((item) => item.code.toUpperCase() === step.noTarget!.toUpperCase());
    if (!target || target.code === step.code) {
      throw new DomainError(`${code}, ${step.code} : « Non » doit mener à une autre étape du logigramme.`);
    }
    step.noTarget = target.code;
  }
  return {
    code,
    name: requiredText(flowchart.name, `${code} : nommez le processus.`),
    description: flowchart.description.trim(),
    steps,
  };
}

/**
 * Agrégat racine : les outils d'analyse qualité du projet (templates « Affinity Diagram »,
 * « Cause and Effect Diagram », « Flowchart ») : un diagramme d'affinités, des analyses des
 * causes et des logigrammes, aux codes uniques.
 */
export class QualityAnalyses {
  private constructor(readonly props: Readonly<QualityAnalysesProps>) {}

  static create(params: QualityAnalysesProps): QualityAnalyses {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation des outils d'analyse invalide.");
    }
    const causeEffects = params.causeEffects.map(causeEffectOf);
    assertUniqueCodes(causeEffects, "d'analyse des causes");
    const flowcharts = params.flowcharts.map(flowchartOf);
    assertUniqueCodes(flowcharts, 'de logigramme');
    return new QualityAnalyses(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        affinity: affinityOf(params.affinity),
        causeEffects,
        flowcharts,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
