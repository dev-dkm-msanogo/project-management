import type { ProjectRecordDto } from '@shared/index';
import { ProjectAvatar } from '@/components/header/ProjectAvatar';
import { IconCheck, IconChevronsUpDown, IconProjects } from '@/components/nav/icons';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '@/components/ui/Menu';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_MODIFIERS } from '@/lib/project-format';

interface ProjectSwitcherProps {
  projects: ProjectRecordDto[];
  currentId: string;
  onSelect: (projectId: string) => void;
  onOpenPortfolio: () => void;
}

/** Sélecteur de projet courant, premier maillon du fil d'Ariane. */
export function ProjectSwitcher({ projects, currentId, onSelect, onOpenPortfolio }: ProjectSwitcherProps) {
  const current = projects.find((project) => project.id === currentId);
  if (!current) {
    return <span className="project-switcher project-switcher--loading">Chargement…</span>;
  }

  return (
    <Menu
      label="Projets"
      triggerClassName="project-switcher"
      triggerLabel={`${current.name} — changer de projet`}
      trigger={
        <>
          <ProjectAvatar project={current} />
          <span className="project-switcher__name">{current.name}</span>
          <span className="project-switcher__chevron">
            <IconChevronsUpDown />
          </span>
        </>
      }
    >
      <MenuHeader>Projets</MenuHeader>
      {projects.map((project) => (
        <MenuItem key={project.id} checked={project.id === currentId} onSelect={() => onSelect(project.id)}>
          <ProjectAvatar project={project} />
          <span className="menu__item-text">{project.name}</span>
          {project.status !== 'ACTIVE' && (
            <span className={`status-badge status-badge--${PROJECT_STATUS_MODIFIERS[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          )}
          <span className="menu__check">{project.id === currentId && <IconCheck />}</span>
        </MenuItem>
      ))}
      <MenuSeparator />
      <MenuItem onSelect={onOpenPortfolio}>
        <span className="menu__icon">
          <IconProjects />
        </span>
        <span className="menu__item-text">Tous les projets</span>
      </MenuItem>
    </Menu>
  );
}
