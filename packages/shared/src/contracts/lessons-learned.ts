/**
 * Contrats du registre des leçons apprises (PMBOK 8 : processus 28, alimenté par 40), alignés sur
 * les templates « Lessons Learned Register » et « Lessons Learned Register – Final ». Dates en
 * ISO-8601.
 */

/** Phase ou domaine du projet où la leçon a été tirée. */
export type LessonCategory =
  | 'INITIATION'
  | 'PLANNING'
  | 'REQUIREMENTS'
  | 'DESIGN'
  | 'BUILD'
  | 'TEST'
  | 'LAUNCH'
  | 'CLOSEOUT'
  | 'STAKEHOLDERS'
  | 'COMMUNICATION'
  | 'RESOURCES'
  | 'QUALITY'
  | 'RISK'
  | 'PROCUREMENT';

export interface LessonInput {
  /** Identifiant, ex. « LL-001 ». */
  code: string;
  category: LessonCategory;
  recordedOn: string;
  /** Situation qui a fait naître la leçon. */
  trigger: string;
  /** La leçon, formulée comme une pratique à appliquer. */
  lesson: string;
  /** Ce qui s'est passé et pourquoi la pratique vaut la peine. */
  details: string;
  /** Qui l'applique sur les projets suivants : ressource du référentiel (identifiant). */
  responsibleId: string;
  comments: string;
}

/** Pratique récurrente qui regroupe plusieurs leçons, à ériger en standard de l'organisation. */
export interface LessonPatternInput {
  name: string;
  lessonCodes: string[];
}

export interface LessonsLearnedInput {
  lessons: LessonInput[];
  patterns: LessonPatternInput[];
  /** Transfert au référentiel de l'organisation (clôture) ; absent tant que le projet n'est pas clos. */
  transferredOn: string | null;
}

export interface LessonsLearnedDto extends LessonsLearnedInput {
  projectId: string;
  summary: { total: number; categories: number; patterns: number };
}
