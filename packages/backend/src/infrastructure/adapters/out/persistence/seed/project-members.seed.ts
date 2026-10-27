import { ProjectTeam } from '@domain/entities/project-team';

/**
 * Équipes des projets de démonstration : Mamadou Ba (compte éditeur) les dirige, Fatou Sow (compte
 * lecteur) les consulte ; Awa Diop, administratrice, voit tous les projets.
 */
export const DEMO_PROJECT_IDS = ['project-alpha', 'project-beta', 'project-gamma'] as const;

export function buildDemoProjectTeams(): ProjectTeam[] {
  return DEMO_PROJECT_IDS.map((projectId) =>
    ProjectTeam.create(projectId, [
      { userId: 'u-editor', role: 'MANAGER' },
      { userId: 'u-viewer', role: 'READER' },
    ]),
  );
}
