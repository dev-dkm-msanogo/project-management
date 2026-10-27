import { useState } from 'react';
import type { PortfolioProjectDto } from '@shared/index';
import { deleteProject } from '@/api/project-client';
import { useAuth } from '@/auth/AuthContext';
import { PageActions } from '@/components/header/PageActions';
import { PortfolioDashboard } from '@/components/projects/PortfolioDashboard';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectTeamDialog } from '@/components/projects/ProjectTeamDialog';
import { DeleteAction } from '@/components/ui/DeleteAction';
import { usePortfolio } from '@/hooks/usePerformance';

interface ProjectsFeatureProps {
  currentProjectId: string;
  onOpen: (projectId: string) => void;
  /** Recharge la liste des projets de l'application (sélecteur de projet). */
  onReload: () => void;
}

/** Page « Portefeuille » : tableau de bord des projets visibles, création, équipe, modification et suppression. */
export function ProjectsFeature({ currentProjectId, onOpen, onReload }: ProjectsFeatureProps) {
  const { data, loading, error, reload } = usePortfolio();
  const { canEdit, canAdminister } = useAuth();
  // `undefined` : panneau fermé ; `null` : création ; un projet : modification.
  const [editing, setEditing] = useState<PortfolioProjectDto | null | undefined>(undefined);
  const [team, setTeam] = useState<PortfolioProjectDto | null>(null);

  const refresh = () => {
    reload();
    onReload();
  };

  return (
    <>
      <PageActions>
        {canEdit && (
          <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>
            + Nouveau projet
          </button>
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du portefeuille…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && data.projects.length === 0 && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Aucun projet pour le moment</h2>
            <p className="empty-state__text">Créez un premier projet pour en suivre l'avancement, les coûts et les risques.</p>
          </section>
        </div>
      )}
      {data && data.projects.length > 0 && (
        <article className="doc-page doc-page--wide">
          <PortfolioDashboard
            projects={data.projects}
            currentProjectId={currentProjectId}
            onOpen={onOpen}
            actions={(project) => (
              <>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  aria-label={`Équipe de ${project.name}`}
                  onClick={() => setTeam(project)}
                >
                  Équipe
                </button>
                {project.access === 'MANAGER' && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    aria-label={`Modifier ${project.name}`}
                    onClick={() => setEditing(project)}
                  >
                    Modifier
                  </button>
                )}
                {canAdminister && (
                  <DeleteAction
                    title={`Supprimer « ${project.name} » ?`}
                    message="Le projet et tous ses documents (charte, registres, plans, rapports…) seront supprimés définitivement, pour tous les utilisateurs."
                    onDelete={async () => {
                      await deleteProject(project.id);
                      refresh();
                    }}
                  />
                )}
              </>
            )}
          />
        </article>
      )}

      {team && <ProjectTeamDialog project={team} onClose={() => setTeam(null)} />}

      {editing !== undefined && (
        <ProjectFormDialog
          project={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            refresh();
          }}
        />
      )}
    </>
  );
}
