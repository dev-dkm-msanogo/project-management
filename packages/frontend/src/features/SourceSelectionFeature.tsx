import { useEffect, useState } from 'react';
import type { SourceSelectionsDto } from '@shared/index';
import { awardSourceSelection } from '@/api/approval-client';
import { sourceSelectionsApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { DecisionDialog } from '@/components/approval/DecisionDialog';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { SourceSelectionEditor } from '@/components/procurement/SourceSelectionEditor';
import { SourceSelectionView } from '@/components/procurement/SourceSelectionView';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useIsApprover } from '@/hooks/useApprovals';
import { useSourceSelections } from '@/hooks/useProjectDocuments';
import { blankSelection, sourceSelectionsDtoToInput } from '@/lib/procurement-format';

/** Page « Sélection des fournisseurs » : une grille d'évaluation pondérée par achat, attribué par un valideur. */
export function SourceSelectionFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useSourceSelections(projectId);
  const { canEdit } = useAuth();
  const isApprover = useIsApprover(projectId);
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [awarding, setAwarding] = useState<string | null>(null);

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, sourceSelectionsApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  const evaluations = data?.evaluations ?? [];

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <SourceSelectionEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={restoring.restored ? sourceSelectionsDtoToInput(restoring.restored) : evaluations.length > 0 ? sourceSelectionsDtoToInput(data) : { evaluations: [blankSelection()] }}
          onCancel={() => {
            setEditing(null);
            restoring.clear();
          }}
          onSaved={() => {
            setEditing(null);
            restoring.clear();
            reload();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageActions>
        {data && restoring.history}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <>
              {evaluations.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer les grilles
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Nouvelle grille
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement des grilles de sélection…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Achats évalués', value: evaluations.length },
              {
                label: 'Candidats évalués',
                value: evaluations.reduce((sum, evaluation) => sum + evaluation.candidates.length, 0),
              },
            ]}
          />
          {evaluations.length === 0 ? (
            <section className="doc-panel empty-state">
              <h2 className="empty-state__title">Aucune grille de sélection</h2>
              <p className="empty-state__text">
                Pour chaque achat, pondérez les critères (total 100 %) et notez chaque candidat de 1 à 5 : le score
                pondéré désigne le fournisseur à recommander.
              </p>
            </section>
          ) : (
            <SourceSelectionView selections={data} onEdit={editEntry} onAward={isApprover ? setAwarding : undefined} />
          )}
        </article>
      )}
      {awarding && (
        <AwardDialog
          evaluation={evaluations.find((evaluation) => evaluation.procurement === awarding)!}
          onConfirm={async (supplier, rationale) => {
            await awardSourceSelection(projectId, { procurement: awarding, supplier, rationale });
            setAwarding(null);
            reload();
          }}
          onClose={() => setAwarding(null)}
        />
      )}
    </>
  );
}

type Evaluation = SourceSelectionsDto['evaluations'][number];

/** Attribution d'un achat : candidat retenu (le premier en tête est proposé) et justification. */
function AwardDialog({
  evaluation,
  onConfirm,
  onClose,
}: {
  evaluation: Evaluation;
  onConfirm: (supplier: string, rationale: string) => Promise<void>;
  onClose: () => void;
}) {
  const totals = new Map(evaluation.candidates.map((name, index) => [name, evaluation.result.totals[index]]));
  return (
    <DecisionDialog
      open
      title={`Attribuer « ${evaluation.procurement} »`}
      context="L'attribution est datée du jour et signée de votre nom ; la grille est ensuite figée."
      choiceLabel="Fournisseur retenu"
      choices={evaluation.candidates.map((name) => ({ value: name, label: `${name} (${totals.get(name)} / 500)` }))}
      initialChoice={evaluation.result.leaders[0] ?? evaluation.candidates[0]!}
      confirmLabel="Attribuer"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
