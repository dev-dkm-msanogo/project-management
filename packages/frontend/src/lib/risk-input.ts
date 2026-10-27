import type { RiskEntryInput, RiskRegisterDto, RiskRegisterInput } from '@shared/index';

/** Conversions entre le modèle de lecture et le modèle de saisie du registre des risques. */

export function riskRegisterDtoToInput(dto: RiskRegisterDto): RiskRegisterInput {
  const input: RiskRegisterInput = {
    risks: dto.risks.map(
      ({ impact: _impact, score: _score, level: _level, residualScore: _residual, residualLevel: _residualLevel, ...risk }) =>
        risk,
    ),
  };
  return structuredClone(input);
}

/** Nouveau risque identifié, analyse par défaut au milieu des échelles. */
export function blankRisk(code: string): RiskEntryInput {
  return {
    code,
    title: '',
    description: null,
    type: 'THREAT',
    category: 'TECHNICAL',
    probability: 3,
    impacts: { scope: 3, quality: 3, time: 3, cost: 3 },
    strategy: null,
    response: null,
    trigger: null,
    ownerId: '',
    status: 'IDENTIFIED',
    trend: 'STABLE',
    dueDate: null,
    lastReviewedOn: null,
    residualProbability: null,
    residualImpact: null,
    comments: null,
  };
}
