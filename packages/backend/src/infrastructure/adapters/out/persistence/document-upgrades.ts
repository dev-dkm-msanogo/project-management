import { COMPUTED_KPI_KEYS } from '@shared/index';
import type {
  AssumptionLogInput,
  ExecutiveStatusReportInput,
  ProjectCharterInput,
  RiskRegisterInput,
  StakeholderRegisterInput,
} from '@shared/index';

/**
 * Mise à niveau, à la lecture, des documents JSONB enregistrés avant l'alignement sur les
 * templates PMI (rubriques ajoutées, champs renommés). Aucune réécriture en base : le
 * document prend la forme courante au prochain enregistrement. Sans effet sur un document
 * déjà au format courant.
 */

// Formes stockées non typées : seules les clés lues ici sont décrites.
type Stored = Record<string, any>;

export function upgradeCharterInput(stored: unknown): ProjectCharterInput {
  // Statut et signatures saisis à la main : remplacés par le circuit de validation.
  const { status: _status, projectManagerSignedOn: _pm, sponsorSignedOn: _sponsor, ...doc } = stored as Stored;
  if ('preparedOn' in doc) return withResourceIds(doc) as ProjectCharterInput;

  // Ancien format : un seul approbateur (approvedBy/approvedOn) et une autorité en texte libre.
  const approvedOn: string | null = doc.approvedOn ?? null;
  return {
    preparedOn: approvedOn ?? new Date().toISOString().slice(0, 10),
    customer: null,
    purpose: doc.purpose,
    description: '',
    inScope: doc.inScope,
    outOfScope: doc.outOfScope,
    deliverables: doc.deliverables,
    requirements: [],
    overallRiskLevel: null,
    highLevelRisks: doc.highLevelRisks,
    objectives: (doc.objectives as Stored[]).map((item) => ({
      category: 'OTHER' as const,
      objective: item.objective,
      successCriterion: item.successCriterion,
    })),
    milestones: doc.milestones,
    budget: doc.budget,
    fundingSource: null,
    exitCriteria: doc.exitCriteria,
    sponsor: { resourceId: doc.sponsor.name, role: doc.sponsor.role, authority: '' },
    projectManager: {
      resourceId: doc.projectManager.name,
      // L'ancienne autorité, unique, portait surtout sur l'engagement des dépenses.
      authority: { staffing: '', budget: doc.projectManager.authority ?? '', technical: '', conflictResolution: '' },
    },
  };
}

/**
 * Sponsor et chef de projet saisis par leur nom (avant le référentiel) : le nom tient lieu
 * d'identifiant inconnu, affiché « à rattacher » jusqu'à ce qu'on choisisse une ressource.
 */
function withResourceIds(doc: Stored): Stored {
  const reference = ({ name, ...rest }: Stored): Stored => ('resourceId' in rest ? rest : { resourceId: name, ...rest });
  return { ...doc, sponsor: reference(doc.sponsor), projectManager: reference(doc.projectManager) };
}

export function upgradeStakeholderRegisterInput(stored: unknown): StakeholderRegisterInput {
  const doc = stored as Stored;
  return {
    stakeholders: (doc.stakeholders as Stored[]).map((item) => ({
      contact: null,
      requirements: null,
      ...item,
    })) as StakeholderRegisterInput['stakeholders'],
  };
}

export function upgradeAssumptionLogInput(stored: unknown): AssumptionLogInput {
  const doc = stored as Stored;
  return {
    entries: (doc.entries as Stored[]).map(({ impact, ...item }) => ({
      actions: null,
      // « impact » est devenu « commentaires » (colonne Comments du template).
      comments: impact ?? null,
      ...item,
    })) as AssumptionLogInput['entries'],
  };
}

export function upgradeRiskRegisterInput(stored: unknown): RiskRegisterInput {
  const doc = stored as Stored;
  return {
    risks: (doc.risks as Stored[]).map(({ impact, ...item }) => ({
      // Impact unique d'avant l'alignement : reporté sur les quatre objectifs (score et criticité inchangés).
      impacts: { scope: impact, quality: impact, time: impact, cost: impact },
      trigger: null,
      residualProbability: null,
      residualImpact: null,
      comments: null,
      ...item,
    })) as RiskRegisterInput['risks'],
  };
}

/**
 * Rapport exécutif saisi en entier, d'avant son alimentation par le projet : seules ses parties
 * rédigées sont reprises. Le niveau global saisi n'est pas repris comme ajustement (le niveau
 * calculé fait foi) ; les indicateurs saisis que le projet calcule désormais sont écartés.
 */
export function upgradeReportInput(stored: unknown): ExecutiveStatusReportInput {
  const doc = stored as Stored;
  const computed = new Set<string>(COMPUTED_KPI_KEYS);
  return {
    reportDate: doc.reportDate,
    reportingPeriod: doc.reportingPeriod,
    overall: {
      statement: doc.overall.statement,
      ragOverride: doc.overall.ragOverride ?? null,
      overrideReason: doc.overall.overrideReason ?? null,
    },
    executiveSummary: doc.executiveSummary,
    decisions: ((doc.decisions ?? []) as Stored[]).map((item) => ({
      description: item.description,
      impact: item.impact ?? null,
      neededBy: item.neededBy ?? null,
    })),
    priorities: doc.priorities ?? [],
    kpis: ((doc.kpis ?? []) as Stored[])
      .filter((item) => !computed.has(item.key))
      .map((item) => ({ key: item.key, label: item.label, value: item.value, hint: item.hint ?? null })),
    forecast: {
      confidencePercentage: doc.forecast?.confidencePercentage ?? 50,
      statement: doc.forecast?.statement ?? '',
    },
  };
}
