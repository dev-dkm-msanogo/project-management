import {
  STAKEHOLDER_QUESTIONS,
  type InfluenceDirection,
  type SalienceCategory,
  type StakeholderDto,
  type StakeholderMappingDto,
  type StakeholderMappingEntryInput,
  type StakeholderMappingInput,
  type StakeholderQuestionKey,
  type StakeholderQuestionnaireDto,
  type StakeholderQuestionnaireInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';
import { HIGH_POWER } from '@/lib/stakeholder-format';

/** Libellés, règles et conversions du questionnaire d'identification et de la cartographie. */

// --- Questionnaire ---

export function blankQuestionnaire(): StakeholderQuestionnaireInput {
  return {
    preparedOn: todayIso(),
    answers: Object.fromEntries(STAKEHOLDER_QUESTIONS.map(({ key }) => [key, ''])) as Record<StakeholderQuestionKey, string>,
  };
}

export function questionnaireDtoToInput(dto: StakeholderQuestionnaireDto): StakeholderQuestionnaireInput {
  return { preparedOn: dto.preparedOn, answers: { ...dto.answers } };
}

// --- Modèle de saillance ---

/** Du plus au moins prioritaire ; « Aucune » : ni pouvoir, ni urgence, ni légitimité. */
export const SALIENCE_ORDER: readonly SalienceCategory[] = [
  'DEFINITIVE',
  'DOMINANT',
  'DEPENDENT',
  'DANGEROUS',
  'DORMANT',
  'DISCRETIONARY',
  'DEMANDING',
  'NONE',
];

export const SALIENCE_LABELS: Record<SalienceCategory, string> = {
  DEFINITIVE: 'Définitive',
  DOMINANT: 'Dominante',
  DEPENDENT: 'Dépendante',
  DANGEROUS: 'Dangereuse',
  DORMANT: 'Dormante',
  DISCRETIONARY: 'Discrétionnaire',
  DEMANDING: 'Exigeante',
  NONE: 'Non saillante',
};

export const SALIENCE_ATTRIBUTES: Record<SalienceCategory, string> = {
  DEFINITIVE: 'Pouvoir + urgence + légitimité',
  DOMINANT: 'Pouvoir + légitimité',
  DEPENDENT: 'Urgence + légitimité',
  DANGEROUS: 'Pouvoir + urgence',
  DORMANT: 'Pouvoir seul',
  DISCRETIONARY: 'Légitimité seule',
  DEMANDING: 'Urgence seule',
  NONE: 'Aucun attribut',
};

export const SALIENCE_ENGAGEMENT: Record<SalienceCategory, string> = {
  DEFINITIVE: 'Priorité absolue : traiter leurs besoins en premier.',
  DOMINANT: 'Attente forte mais non pressante : les garder satisfaits.',
  DEPENDENT: "Ne peuvent pas agir seuls : le chef de projet porte leurs besoins.",
  DANGEROUS: 'Pression sans légitimité : gérer avec prudence, les sujets peuvent surgir vite.',
  DORMANT: 'Influence latente : informer suffisamment pour rester vigilant.',
  DISCRETIONARY: "À informer ; peu d'effet immédiat sur le projet.",
  DEMANDING: 'Insistants mais peu influents : prendre acte sans surinvestir.',
  NONE: "Ne relèvent pas des parties prenantes actives : à réexaminer si leur situation change.",
};

/** Modèle de saillance (même règle que le serveur) : la combinaison fixe la catégorie. */
export function salienceOf(power: boolean, urgency: boolean, legitimacy: boolean): SalienceCategory {
  if (power && urgency && legitimacy) return 'DEFINITIVE';
  if (power && legitimacy) return 'DOMINANT';
  if (urgency && legitimacy) return 'DEPENDENT';
  if (power && urgency) return 'DANGEROUS';
  if (power) return 'DORMANT';
  if (legitimacy) return 'DISCRETIONARY';
  if (urgency) return 'DEMANDING';
  return 'NONE';
}

/** Pouvoir du modèle de saillance : niveau élevé dans le registre (seuil de la grille). */
export const hasPower = (stakeholder: StakeholderDto | undefined) => (stakeholder?.power ?? 0) >= HIGH_POWER;

// --- Directions d'influence ---

export const DIRECTION_ORDER: readonly InfluenceDirection[] = ['UPWARD', 'SIDEWARD', 'OUTWARD', 'DOWNWARD'];

export const DIRECTION_LABELS: Record<InfluenceDirection, string> = {
  UPWARD: 'Vers le haut',
  DOWNWARD: 'Vers le bas',
  OUTWARD: "Vers l'extérieur",
  SIDEWARD: 'Latérale',
};

export const DIRECTION_DESCRIPTIONS: Record<InfluenceDirection, string> = {
  UPWARD: 'Direction générale, sponsor et instances de décision',
  DOWNWARD: "Membres de l'équipe projet rattachés au chef de projet",
  OUTWARD: 'Externes : clients, usagers, fournisseurs, régulateurs, public',
  SIDEWARD: "Pairs et responsables fonctionnels de l'organisation",
};

// --- Analyse (intérêt, influence, attitude) ---

export type AnalysisLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/** Niveau d'un score du registre (1 à 5) : faible de 1 à 2, moyen à 3, élevé de 4 à 5. */
export function analysisLevel(score: number): AnalysisLevel {
  if (score >= 4) return 'HIGH';
  return score === 3 ? 'MEDIUM' : 'LOW';
}

export const INTEREST_LEVELS: Record<AnalysisLevel, { label: string; hint: string }> = {
  HIGH: { label: 'Élevé', hint: 'Impact direct, implication quotidienne' },
  MEDIUM: { label: 'Moyen', hint: 'Implication périodique' },
  LOW: { label: 'Faible', hint: 'Impact indirect ou ponctuel' },
};

export const INFLUENCE_LEVELS: Record<AnalysisLevel, { label: string; hint: string }> = {
  HIGH: { label: 'Élevée', hint: 'Peut approuver ou bloquer' },
  MEDIUM: { label: 'Moyenne', hint: 'Peut peser sur les résultats' },
  LOW: { label: 'Faible', hint: 'Influence limitée' },
};

// --- Cartographie ---

/** Entrée préremplie depuis le registre : légitime, sans urgence, externe vers l'extérieur. */
export function mappingEntryFor(stakeholder: StakeholderDto): StakeholderMappingEntryInput {
  return {
    stakeholderCode: stakeholder.code,
    urgency: false,
    legitimacy: true,
    direction: stakeholder.type === 'EXTERNAL' ? 'OUTWARD' : 'SIDEWARD',
  };
}

export function blankMapping(stakeholders: readonly StakeholderDto[]): StakeholderMappingInput {
  return { preparedOn: todayIso(), entries: stakeholders.map(mappingEntryFor) };
}

export function mappingDtoToInput(dto: StakeholderMappingDto): StakeholderMappingInput {
  return {
    preparedOn: dto.preparedOn,
    entries: dto.entries.map(({ stakeholderCode, urgency, legitimacy, direction }) => ({
      stakeholderCode,
      urgency,
      legitimacy,
      direction,
    })),
  };
}
