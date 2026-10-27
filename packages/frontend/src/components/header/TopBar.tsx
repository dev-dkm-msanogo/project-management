import type { CSSProperties } from 'react';
import type { ProjectRecordDto } from '@shared/index';
import { AccountMenu } from '@/components/header/AccountMenu';
import { ProjectSwitcher } from '@/components/header/ProjectSwitcher';
import { IconProjects } from '@/components/nav/icons';
import {
  outputForView,
  outputGroup,
  processGroup,
  STANDALONE_VIEWS,
  type AppView,
  type StandaloneView,
} from '@/navigation/pmp';

interface TopBarProps {
  view: AppView;
  projects: ProjectRecordDto[];
  projectId: string;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: AppView) => void;
}

/** Barre supérieure : fil d'Ariane (projet › groupe de processus) et compte. */
export function TopBar({ view, projects, projectId, onSelectProject, onNavigate }: TopBarProps) {
  const output = outputForView(view);
  const group = output ? processGroup(outputGroup(output)) : null;

  return (
    <header className="topbar">
      <nav className="breadcrumb" aria-label="Fil d'Ariane">
        <ol className="breadcrumb__list">
          {group ? (
            <>
              <li className="breadcrumb__item">
                <ProjectSwitcher
                  projects={projects}
                  currentId={projectId}
                  onSelect={onSelectProject}
                  onOpenPortfolio={() => onNavigate('projects')}
                />
              </li>
              <li
                className="breadcrumb__item breadcrumb__item--group"
                style={{ '--section-color': group.color } as CSSProperties}
              >
                <span className="breadcrumb__dot" aria-hidden="true" />
                {group.label}
              </li>
            </>
          ) : (
            <li className="breadcrumb__item breadcrumb__item--root">
              <IconProjects />
              {STANDALONE_VIEWS[view as StandaloneView].section}
            </li>
          )}
        </ol>
      </nav>
      <AccountMenu onOpenAccount={() => onNavigate('account')} />
    </header>
  );
}
