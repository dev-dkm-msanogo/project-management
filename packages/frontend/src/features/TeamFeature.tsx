import { useEffect, useState } from 'react';
import type { TeamAssessmentInput } from '@shared/index';
import { teamApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { TeamAssessmentEditor } from '@/components/closing/TeamAssessmentEditor';
import { TeamView } from '@/components/closing/TeamView';
import { PageActions } from '@/components/header/PageActions';
import { RestoredNotice, VersionHistory } from '@/components/history/VersionHistory';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useTeam } from '@/hooks/useProjectDocuments';
import { startedAssessment, teamDtoToInput } from '@/lib/closing-format';
import type { AppView } from '@/navigation/pmp';

interface TeamFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Équipe et affectations » : équipe relue dans le projet, évaluation de sa performance. */
export function TeamFeature({ projectId, onNavigate }: TeamFeatureProps) {
  const { data, loading, error, reload } = useTeam(projectId);
  const { canEdit } = useAuth();
  // Évaluation en cours d'édition, et version passée reprise le cas échéant.
  const [editing, setEditing] = useState<{ input: TeamAssessmentInput; version: number | null } | null>(null);

  useEffect(() => setEditing(null), [projectId]);

  if (editing) {
    return (
      <>
        {editing.version !== null && <RestoredNotice version={editing.version} />}
        <TeamAssessmentEditor
          projectId={projectId}
          initialInput={startedAssessment(editing.input)}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageActions>
        {data && (
          <VersionHistory
            projectId={projectId}
            api={teamApi}
            canRestore={canEdit}
            onRestore={(dto, version) => setEditing({ input: teamDtoToInput(dto), version })}
          />
        )}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setEditing({ input: teamDtoToInput(data), version: null })}
            >
              {data.assessedOn ? "Modifier l'évaluation" : "Évaluer l'équipe"}
            </button>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement de l'équipe…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && <TeamView team={data} onNavigate={onNavigate} />}
    </>
  );
}
