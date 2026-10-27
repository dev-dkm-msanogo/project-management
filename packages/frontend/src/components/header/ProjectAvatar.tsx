import type { ProjectRecordDto } from '@shared/index';
import { initials } from '@/lib/initials';

const HUES = ['blue', 'navy', 'teal', 'grey', 'rust', 'green'] as const;

/** Mot générique ignoré pour les initiales : « Projet Alpha » → « A ». */
const GENERIC_WORD = /^(projet|project|programme|program)$/i;

function projectInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const significant = words.length > 1 && GENERIC_WORD.test(words[0]!) ? words.slice(1) : words;
  return initials(significant.join(' '));
}

/** Teinte stable dérivée de l'identifiant : un projet garde toujours la même couleur. */
function hueOf(id: string): (typeof HUES)[number] {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length]!;
}

export function ProjectAvatar({ project }: { project: Pick<ProjectRecordDto, 'id' | 'name'> }) {
  return (
    <span className={`project-avatar project-avatar--${hueOf(project.id)}`} aria-hidden="true">
      {projectInitials(project.name)}
    </span>
  );
}
