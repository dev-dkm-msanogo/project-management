import { RiskEntry } from '@domain/entities/risk-entry';
import { isoDateOrNull, parseIsoDateOrNull } from '@application/mappers/iso-date';
import { RiskRegister } from '@domain/entities/risk-register';
import type {
  MajorRisksDto,
  RiskEntryDto,
  RiskEntryInput,
  RiskRegisterDto,
  RiskRegisterInput,
} from '@shared/index';

/** Traductions du registre des risques : domaine ⇄ modèle de saisie ⇄ modèle de lecture. */

function entryToInput(risk: RiskEntry): RiskEntryInput {
  return {
    code: risk.code,
    title: risk.title,
    description: risk.description,
    type: risk.type,
    category: risk.category,
    probability: risk.probability,
    impacts: risk.impacts,
    strategy: risk.strategy,
    response: risk.response,
    trigger: risk.trigger,
    ownerId: risk.ownerId,
    status: risk.status,
    trend: risk.trend,
    dueDate: isoDateOrNull(risk.dueDate),
    lastReviewedOn: isoDateOrNull(risk.lastReviewedOn),
    residualProbability: risk.residualProbability,
    residualImpact: risk.residualImpact,
    comments: risk.comments,
  };
}

function entryToDto(risk: RiskEntry): RiskEntryDto {
  return {
    ...entryToInput(risk),
    impact: risk.impact,
    score: risk.score,
    level: risk.level,
    residualScore: risk.residualScore,
    residualLevel: risk.residualLevel,
  };
}

/** Domaine → lecture (score et criticité inclus). */
export function toRiskRegisterDto(register: RiskRegister): RiskRegisterDto {
  return { projectId: register.projectId, risks: register.risks.map(entryToDto) };
}

/** Domaine → vue « risques majeurs » du rapport exécutif. */
export function toMajorRisksDto(register: RiskRegister): MajorRisksDto {
  return { items: register.majorRisks().map(entryToDto), openCount: register.openRisks.length };
}

/** Domaine → saisie (forme de persistance, champs calculés exclus). */
export function riskRegisterToInput(register: RiskRegister): RiskRegisterInput {
  return { risks: register.risks.map(entryToInput) };
}

/** Saisie → domaine (revalide tous les invariants). */
export function inputToRiskRegister(projectId: string, input: RiskRegisterInput): RiskRegister {
  return RiskRegister.create({
    projectId,
    risks: input.risks.map((risk) =>
      RiskEntry.create({
        ...risk,
        dueDate: parseIsoDateOrNull(risk.dueDate),
        lastReviewedOn: parseIsoDateOrNull(risk.lastReviewedOn),
      }),
    ),
  });
}
