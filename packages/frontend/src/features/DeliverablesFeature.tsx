import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { DeliverableEditor } from '@/components/closing/DeliverableEditor';
import { DeliverablesTable } from '@/components/closing/DeliverablesTable';
import { PageActions } from '@/components/header/PageActions';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useDeliverables } from '@/hooks/useProjectDocuments';
import type { AppView } from '@/navigation/pmp';

interface DeliverablesFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Livrables » : production, vérification et acceptation des livrables désignés dans la WBS. */
export function DeliverablesFeature({ projectId, onNavigate }: DeliverablesFeatureProps) {
  const { data, loading, error, reload } = useDeliverables(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => setEditing(null), [projectId]);

  if (editing && data) {
    return (
      <DeliverableEditor
        projectId={projectId}
        register={data}
        wbsCode={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    );
  }

  const summary = data?.summary;
  return (
    <>
      <PageActions>{!canEdit && <ReadOnlyBadge />}</PageActions>

      {loading && <p className="app__status">Chargement des livrables…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && summary && (
        <article className="doc-page">
          {data.deliverables.length === 0 ? (
            <section className="doc-panel empty-state">
              <h2 className="empty-state__title">Aucun livrable désigné</h2>
              <p className="empty-state__text">
                Un livrable est un élément de la WBS dont la fiche du dictionnaire nomme le livrable clé et ses critères
                d'acceptation.
              </p>
              <button type="button" className="ref-link" onClick={() => onNavigate('wbs-dictionary')}>
                Dictionnaire de la WBS →
              </button>
            </section>
          ) : (
            <>
              <SummaryTiles
                tiles={[
                  { label: 'En production', value: summary.inProduction },
                  { label: 'À vérifier', value: summary.toVerify, tone: 'warning' },
                  { label: "En attente d'acceptation", value: summary.awaitingAcceptance, tone: 'alert' },
                  { label: 'Acceptés', value: summary.accepted, tone: 'success' },
                  { label: 'Refusés', value: summary.rejected, tone: 'danger' },
                ]}
              />
              <section className="doc-panel">
                <DeliverablesTable
                  deliverables={data.deliverables}
                  onNavigate={onNavigate}
                  onEdit={canEdit ? setEditing : undefined}
                />
                <button type="button" className="ref-link" onClick={() => onNavigate('wbs-dictionary')}>
                  Dictionnaire de la WBS →
                </button>
              </section>
            </>
          )}
        </article>
      )}
    </>
  );
}
