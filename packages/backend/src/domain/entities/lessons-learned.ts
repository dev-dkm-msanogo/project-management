import { DomainError } from '@domain/errors/domain-errors';
import {
  assertProjectId,
  assertUniqueCodes,
  assertUniqueNames,
  entryCode,
  requiredText,
} from '@domain/value-objects/register-rules';

export const LESSON_CATEGORIES = [
  'INITIATION',
  'PLANNING',
  'REQUIREMENTS',
  'DESIGN',
  'BUILD',
  'TEST',
  'LAUNCH',
  'CLOSEOUT',
  'STAKEHOLDERS',
  'COMMUNICATION',
  'RESOURCES',
  'QUALITY',
  'RISK',
  'PROCUREMENT',
] as const;
export type LessonCategory = (typeof LESSON_CATEGORIES)[number];

export interface LessonProps {
  code: string;
  category: LessonCategory;
  recordedOn: Date;
  trigger: string;
  lesson: string;
  details: string;
  /** Qui applique la leçon : ressource du référentiel (identifiant). */
  responsibleId: string;
  comments: string;
}

export interface LessonPattern {
  name: string;
  lessonCodes: readonly string[];
}

/** Leçon apprise (template « Lessons Learned Register ») : une situation, une pratique, un porteur. */
export class Lesson {
  private constructor(readonly props: Readonly<LessonProps>) {}

  static create(params: LessonProps): Lesson {
    const code = entryCode(params.code, 'de leçon');
    if (!(LESSON_CATEGORIES as readonly string[]).includes(params.category)) {
      throw new DomainError(`${code} : catégorie inconnue.`);
    }
    if (Number.isNaN(params.recordedOn.getTime())) {
      throw new DomainError(`${code} : date invalide.`);
    }
    return new Lesson(
      Object.freeze({
        code,
        category: params.category,
        recordedOn: new Date(params.recordedOn),
        trigger: requiredText(params.trigger, `${code} : décrivez la situation qui a fait naître la leçon.`),
        lesson: requiredText(params.lesson, `${code} : formulez la leçon.`),
        details: params.details.trim(),
        responsibleId: requiredText(params.responsibleId, `${code} : choisissez qui applique la leçon dans le référentiel des ressources.`),
        comments: params.comments.trim(),
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }
}

/**
 * Agrégat racine : le registre des leçons apprises d'un projet. Les pratiques récurrentes
 * regroupent des leçons du registre ; le transfert au référentiel de l'organisation, à la
 * clôture, suit la dernière leçon. Un registre vide est valide.
 */
export class LessonsLearned {
  private constructor(
    public readonly projectId: string,
    public readonly lessons: readonly Lesson[],
    public readonly patterns: readonly LessonPattern[],
    public readonly transferredOn: Date | null,
  ) {}

  static create(params: {
    projectId: string;
    lessons: readonly Lesson[];
    patterns: readonly LessonPattern[];
    transferredOn: Date | null;
  }): LessonsLearned {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.lessons, 'de leçon');

    const known = new Map(params.lessons.map((lesson) => [lesson.code.toUpperCase(), lesson.code]));
    const patterns = params.patterns.map((pattern, index) => {
      const name = requiredText(pattern.name, `Nommez la pratique récurrente n° ${index + 1}.`);
      const codes = [...new Set(pattern.lessonCodes.map((code) => code.trim().toUpperCase()))];
      if (codes.length === 0) {
        throw new DomainError(`« ${name} » : rattachez au moins une leçon.`);
      }
      const unknown = codes.filter((code) => !known.has(code));
      if (unknown.length > 0) {
        throw new DomainError(`« ${name} » : leçon(s) absente(s) du registre : ${unknown.join(', ')}.`);
      }
      // Codes normalisés à leur orthographe dans le registre.
      return { name, lessonCodes: codes.map((code) => known.get(code)!) };
    });
    assertUniqueNames(patterns.map((pattern) => pattern.name), (name) => `Pratique récurrente en double : « ${name} ».`);

    const transferredOn = params.transferredOn;
    if (transferredOn) {
      if (Number.isNaN(transferredOn.getTime())) {
        throw new DomainError('Date de transfert du registre invalide.');
      }
      const latest = Math.max(...params.lessons.map((lesson) => lesson.props.recordedOn.getTime()));
      if (transferredOn.getTime() < latest) {
        throw new DomainError('Le registre ne peut être transféré avant sa dernière leçon.');
      }
    }

    return new LessonsLearned(
      params.projectId,
      [...params.lessons],
      patterns,
      transferredOn ? new Date(transferredOn) : null,
    );
  }

  static empty(projectId: string): LessonsLearned {
    return LessonsLearned.create({ projectId, lessons: [], patterns: [], transferredOn: null });
  }

  get summary(): { total: number; categories: number; patterns: number } {
    return {
      total: this.lessons.length,
      categories: new Set(this.lessons.map((lesson) => lesson.props.category)).size,
      patterns: this.patterns.length,
    };
  }
}
