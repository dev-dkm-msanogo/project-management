import type { LessonCategory, LessonInput, LessonsLearnedDto, LessonsLearnedInput } from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et conversions du registre des leçons apprises (template « Lessons Learned Register »). */

export const LESSON_CATEGORY_LABELS: Record<LessonCategory, string> = {
  INITIATION: 'Démarrage',
  PLANNING: 'Planification',
  REQUIREMENTS: 'Exigences',
  DESIGN: 'Conception',
  BUILD: 'Réalisation',
  TEST: 'Tests',
  LAUNCH: 'Mise en production',
  CLOSEOUT: 'Clôture',
  STAKEHOLDERS: 'Parties prenantes',
  COMMUNICATION: 'Communication',
  RESOURCES: 'Ressources',
  QUALITY: 'Qualité',
  RISK: 'Risques',
  PROCUREMENT: 'Approvisionnements',
};

export const LESSON_CATEGORIES = Object.keys(LESSON_CATEGORY_LABELS) as LessonCategory[];

export function blankLesson(code: string): LessonInput {
  return {
    code,
    category: 'PLANNING',
    recordedOn: todayIso(),
    trigger: '',
    lesson: '',
    details: '',
    responsibleId: '',
    comments: '',
  };
}

export function lessonsLearnedDtoToInput(dto: LessonsLearnedDto): LessonsLearnedInput {
  const { projectId: _projectId, summary: _summary, ...input } = dto;
  return structuredClone(input);
}
