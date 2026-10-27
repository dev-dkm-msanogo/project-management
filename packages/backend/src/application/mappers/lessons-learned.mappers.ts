import { Lesson, LessonsLearned } from '@domain/entities/lessons-learned';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { LessonsLearnedDto, LessonsLearnedInput } from '@shared/index';

/** Traductions du registre des leçons apprises : domaine ⇄ saisie ⇄ lecture. */

export function lessonsLearnedToInput(register: LessonsLearned): LessonsLearnedInput {
  return {
    lessons: register.lessons.map(({ props }) => ({ ...props, recordedOn: isoDate(props.recordedOn) })),
    patterns: register.patterns.map((pattern) => ({ name: pattern.name, lessonCodes: [...pattern.lessonCodes] })),
    transferredOn: isoDateOrNull(register.transferredOn),
  };
}

export function inputToLessonsLearned(projectId: string, input: LessonsLearnedInput): LessonsLearned {
  return LessonsLearned.create({
    projectId,
    lessons: input.lessons.map((lesson) => Lesson.create({ ...lesson, recordedOn: parseIsoDate(lesson.recordedOn) })),
    patterns: input.patterns,
    transferredOn: parseIsoDateOrNull(input.transferredOn),
  });
}

export function toLessonsLearnedDto(register: LessonsLearned): LessonsLearnedDto {
  return { projectId: register.projectId, ...lessonsLearnedToInput(register), summary: register.summary };
}
