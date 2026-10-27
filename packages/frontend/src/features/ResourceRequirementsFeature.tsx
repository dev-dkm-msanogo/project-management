import { useEffect, useState } from 'react';
import { resourceRequirementsApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { ResourceBreakdown } from '@/components/resources/ResourceBreakdown';
import { ResourceRequirementsTable } from '@/components/resources/ResourceRequirementsTable';
import { ResourceRequirementsEditor } from '@/components/resources/editor/ResourceRequirementsEditor';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { Tabs } from '@/components/ui/Tabs';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { useResourceRequirements } from '@/hooks/useProjectDocuments';
import { RESOURCE_NARRATIVE_LABELS, resourceRequirementsDtoToInput } from '@/lib/resource-format';

type ResourcesTab = 'requirements' | 'rbs' | 'basis';

/**
 * Page « Besoins en ressources » : besoins, structure de découpage des ressources (RBS,
 * déduite des besoins) et base des estimations, en onglets.
 */
export function ResourceRequirementsFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { data, loading, error, reload } = useResourceRequirements(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [tab, setTab] = useState<ResourcesTab>('requirements');

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, resourceRequirementsApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <ResourceRequirementsEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={resourceRequirementsDtoToInput(restoring.restored ?? data)}
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

  const requirements = data?.requirements ?? [];
  const count = (predicate: (category: string) => boolean) =>
    requirements.filter((requirement) => predicate(requirement.category)).length;

  return (
    <>
      <PageActions>
        {data && restoring.history}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <>
              {requirements.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer les besoins
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Ajouter une ressource
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement des besoins en ressources…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Ressources humaines', value: count((category) => category === 'PEOPLE') },
              { label: 'Ressources physiques', value: count((category) => category !== 'PEOPLE') },
            ]}
          />
          {requirements.length === 0 ? (
            <section className="doc-panel empty-state">
              <h2 className="empty-state__title">Aucun besoin en ressources</h2>
              <p className="empty-state__text">
                Recensez les personnes et les ressources physiques (équipements, données, logiciels, locaux) que
                demandent les activités : la structure de découpage des ressources s'en déduit.
              </p>
            </section>
          ) : (
            <section className="doc-panel">
              <Tabs
                label="Vues des besoins en ressources"
                active={tab}
                onChange={setTab}
                tabs={[
                  { id: 'requirements', label: 'Besoins', count: requirements.length },
                  { id: 'rbs', label: 'Structure de découpage (RBS)' },
                  { id: 'basis', label: 'Base des estimations' },
                ]}
              >
                {tab === 'requirements' && <ResourceRequirementsTable requirements={requirements} onEdit={editEntry} />}
                {tab === 'rbs' && <ResourceBreakdown requirements={requirements} projectName={projectName} />}
                {tab === 'basis' && <TextSections sections={sectionsOf(RESOURCE_NARRATIVE_LABELS, data.narrative)} />}
              </Tabs>
            </section>
          )}
        </article>
      )}
    </>
  );
}
