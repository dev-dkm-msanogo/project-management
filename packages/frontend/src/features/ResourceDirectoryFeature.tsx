import { useState } from 'react';
import type { DirectoryResourceDto, ResourceKind } from '@shared/index';
import { resourceDirectoryApi } from '@/api/admin-client';
import { useAuth } from '@/auth/AuthContext';
import { ResourceFormDialog } from '@/components/admin/ResourceFormDialog';
import { CheckboxInput, SelectInput } from '@/components/form/controls';
import { PageActions } from '@/components/header/PageActions';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { usePeople } from '@/components/people/People';
import { useResourceDirectory, useUsers } from '@/hooks/useAdministration';
import { matchesResource, RESOURCE_KIND_LABELS } from '@/lib/admin-format';

type KindFilter = ResourceKind | 'ALL';

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'INTERNAL', label: 'Internes' },
  { value: 'EXTERNAL', label: 'Prestataires externes' },
];

/**
 * Page « Référentiel des ressources » : personnes et prestataires mobilisables par les projets.
 * Lecture pour tous (taux réservés aux éditeurs), gestion par les administrateurs.
 */
export function ResourceDirectoryFeature() {
  const { canAdminister } = useAuth();
  const { data, loading, error, reload: reloadDirectory } = useResourceDirectory();
  const people = usePeople();
  // Le référentiel alimente toutes les listes de personnes : elles suivent ses modifications.
  const reload = () => {
    reloadDirectory();
    people.reload();
  };
  const { data: users } = useUsers(canAdminister);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<{ resource: DirectoryResourceDto | null } | null>(null);
  const [deleting, setDeleting] = useState<DirectoryResourceDto | null>(null);

  const resources = data?.resources ?? [];
  const visible = resources.filter(
    (resource) =>
      (showArchived || resource.active) && (kind === 'ALL' || resource.kind === kind) && matchesResource(resource, query),
  );
  const active = resources.filter((resource) => resource.active);
  const userName = (userId: string | null) => users?.find((user) => user.id === userId)?.name;
  const linkedUserIds = new Set(resources.map((resource) => resource.userId).filter((id): id is string => id !== null));

  return (
    <>
      <PageActions>
        {canAdminister && (
          <button type="button" className="btn btn--primary" onClick={() => setEditing({ resource: null })}>
            + Nouvelle ressource
          </button>
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du référentiel…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Ressources actives', value: active.length },
              { label: 'Internes', value: active.filter((resource) => resource.kind === 'INTERNAL').length },
              { label: 'Prestataires externes', value: active.filter((resource) => resource.kind === 'EXTERNAL').length },
              { label: 'Rattachées à un compte', value: active.filter((resource) => resource.userId).length },
            ]}
          />
          <section className="doc-panel">
            <div className="filter-bar" role="search">
              <label className="filter-bar__search">
                <span className="visually-hidden">Rechercher une ressource</span>
                <input
                  className="form-input"
                  type="search"
                  placeholder="Nom, fonction, service ou compétence…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <SelectInput value={kind} onChange={setKind} options={KIND_FILTERS} />
              <CheckboxInput label="Afficher les archivées" checked={showArchived} onChange={setShowArchived} />
              <span className="filter-bar__count" aria-live="polite">
                {visible.length} ressource{visible.length > 1 ? 's' : ''}
              </span>
            </div>

            {visible.length === 0 ? (
              <p className="plan__empty">Aucune ressource ne correspond à ces critères.</p>
            ) : (
              <div className="wbs-scroll">
                <table className="register-table register-table--directory">
                  <thead>
                    <tr>
                      <th>Ressource</th>
                      <th>Service ou entreprise</th>
                      <th>Type</th>
                      <th>Compétences</th>
                      {canAdminister && <th>Compte</th>}
                      {canAdminister && (
                        <th>
                          <span className="visually-hidden">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((resource) => (
                      <tr key={resource.id} className={resource.active ? undefined : 'register-row--muted'}>
                        <td className="register-table__title">
                          {resource.name}
                          {!resource.active && <span className="self-tag">archivée</span>}
                          {resource.jobTitle && <span className="register-table__muted">{resource.jobTitle}</span>}
                        </td>
                        <td>{resource.department || '—'}</td>
                        <td>
                          <span className={`status-badge status-badge--${resource.kind === 'INTERNAL' ? 'blue' : 'amber'}`}>
                            {RESOURCE_KIND_LABELS[resource.kind]}
                          </span>
                        </td>
                        <td>
                          <span className="skill-chips">
                            {resource.skills.map((skill) => (
                              <span key={skill} className="skill-chip">
                                {skill}
                              </span>
                            ))}
                          </span>
                        </td>
                        {canAdminister && <td>{userName(resource.userId) ?? '—'}</td>}
                        {canAdminister && (
                          <td className="row-actions">
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing({ resource })}>
                              Modifier
                            </button>
                            <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => setDeleting(resource)}>
                              Supprimer
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </article>
      )}

      {editing && (
        <ResourceFormDialog
          resource={editing.resource}
          users={users ?? []}
          linkedUserIds={linkedUserIds}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Supprimer la ressource"
        message={
          <p>
            Supprimer <strong>{deleting?.name}</strong> du référentiel ? Une ressource désignée dans un projet ne se
            supprime pas : archivez-la (décocher « Ressource active »).
          </p>
        }
        confirmLabel="Supprimer"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await resourceDirectoryApi.remove(deleting.id);
          setDeleting(null);
          reload();
        }}
      />
    </>
  );
}
