import { useEffect, useState } from 'react';
import type { BacklogItemInput, BacklogItemType } from '@shared/index';
import { backlogApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { BacklogDecision } from '@/components/agile/BacklogDecision';
import { BacklogItemEditor } from '@/components/agile/BacklogItemEditor';
import { PageActions } from '@/components/header/PageActions';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { Tabs } from '@/components/ui/Tabs';
import { useBacklogRights } from '@/hooks/useBacklogRights';
import { useProductBacklog } from '@/hooks/useProjectDocuments';
import {
  formatPoints,
  ITEM_STATUS_LABELS,
  ITEM_STATUS_MODIFIERS,
  ITEM_TYPE_LABELS,
  productBacklogDtoToInput,
} from '@/lib/agile-format';
import { formatShortDate } from '@/lib/format';
import { PRIORITY_LABELS, PRIORITY_MODIFIERS } from '@/lib/requirements-format';
import type { AppView } from '@/navigation/pmp';

type BacklogTab = 'todo' | 'done' | 'epics';

interface BacklogFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/**
 * Page « Carnet de produit » : éléments dans l'ordre de priorité, épopées et définition de « terminé ».
 * Le Product Owner ordonne, priorise et accepte ; l'équipe propose, estime et fait avancer.
 */
export function BacklogFeature({ projectId, onNavigate }: BacklogFeatureProps) {
  const { data, loading, error, reload } = useProductBacklog(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<{ key: string | null; type: BacklogItemType } | null>(null);
  const [tab, setTab] = useState<BacklogTab>('todo');
  const [moveError, setMoveError] = useState<string | null>(null);
  const rights = useBacklogRights(data);

  useEffect(() => setEditing(null), [projectId]);

  if (editing && data) {
    const close = () => setEditing(null);
    return (
      <BacklogItemEditor
        projectId={projectId}
        backlog={data}
        target={{ key: editing.key }}
        newType={editing.type}
        onCancel={close}
        onSaved={() => {
          close();
          reload();
        }}
      />
    );
  }

  /** Remonte ou descend un élément d'un rang parmi les éléments affichés. */
  const move = async (item: BacklogItemInput, direction: -1 | 1, shown: readonly BacklogItemInput[]) => {
    if (!data) return;
    const neighbour = shown[shown.indexOf(item) + direction];
    if (!neighbour) return;
    const input = productBacklogDtoToInput(data);
    const items = [...input.items];
    const from = items.findIndex((entry) => entry.code === item.code);
    const to = items.findIndex((entry) => entry.code === neighbour.code);
    [items[from], items[to]] = [items[to]!, items[from]!];
    try {
      setMoveError(null);
      await backlogApi.save(projectId, { ...input, items });
      reload();
    } catch (cause) {
      setMoveError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const items = data?.items ?? [];
  const work = items.filter((item) => item.type !== 'EPIC');
  const shown =
    tab === 'epics'
      ? items.filter((item) => item.type === 'EPIC')
      : work.filter((item) => (tab === 'done') === (item.status === 'DONE'));
  const metrics = data?.metrics;
  const iterationName = (code: string | null) => data?.iterations.find((iteration) => iteration.code === code)?.name ?? '—';

  return (
    <>
      <PageActions>
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <>
              {rights.decide && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing({ key: null, type: 'EPIC' })}>
                  + Épopée
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null, type: 'STORY' })}>
                {rights.decide ? '+ Élément du carnet' : '+ Proposer un élément'}
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du carnet de produit…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {moveError && <p className="app__status app__status--error">{moveError}</p>}
      {data && metrics && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Points au carnet', value: metrics.totalPoints },
              { label: 'Points terminés', value: metrics.donePoints, tone: 'success' },
              { label: 'Points restants', value: metrics.remainingPoints },
              { label: 'Éléments non estimés', value: metrics.unestimated, tone: 'warning' },
            ]}
          />
          <p className={`backlog-owner${data.productOwner ? '' : ' backlog-owner--missing'}`} role="status">
            {data.productOwner ? (
              <>
                Product Owner : <strong>{data.productOwner.name}</strong> — il ordonne le carnet, le priorise et accepte
                les éléments ; l'équipe estime et fait avancer le travail.
              </>
            ) : (
              <>
                Aucun Product Owner désigné : le chef de projet priorise et accepte. Désignez-le dans l'équipe du projet
                (portefeuille, « Équipe »).
              </>
            )}
          </p>
          <section className="doc-panel">
            <Tabs
              label="Éléments du carnet"
              active={tab}
              onChange={setTab}
              tabs={[
                { id: 'todo', label: 'À réaliser', count: work.filter((item) => item.status !== 'DONE').length },
                { id: 'done', label: 'Terminés', count: work.filter((item) => item.status === 'DONE').length },
                { id: 'epics', label: 'Épopées', count: items.length - work.length },
              ]}
            >
              {shown.length === 0 ? (
                <p className="plan__empty">Aucun élément.</p>
              ) : (
                <div className="wbs-scroll">
                  <table className="register-table register-table--backlog">
                    <thead>
                      <tr>
                        <th>Rang</th>
                        <th>Élément</th>
                        <th>Priorité</th>
                        <th>{tab === 'epics' ? 'Avancement' : 'Points'}</th>
                        {tab !== 'epics' && <th>Statut</th>}
                        {tab !== 'epics' && <th>Itération</th>}
                        {tab !== 'epics' && <th>Affecté à</th>}
                        {canEdit && <EditHeader />}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((item, index) => {
                        const epic = data.metrics.epics[item.code];
                        return (
                          <tr key={item.code}>
                            <td>
                              <div className="backlog-rank">
                                <span>{index + 1}</span>
                                {rights.decide && tab === 'todo' && (
                                  <span className="backlog-rank__moves">
                                    <button type="button" className="btn btn--ghost btn--sm" aria-label={`Monter ${item.code}`}
                                      disabled={index === 0} onClick={() => void move(item, -1, shown)}>
                                      ↑
                                    </button>
                                    <button type="button" className="btn btn--ghost btn--sm" aria-label={`Descendre ${item.code}`}
                                      disabled={index === shown.length - 1} onClick={() => void move(item, 1, shown)}>
                                      ↓
                                    </button>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="register-table__title">
                              <span className="register-table__code">{item.code}</span> {item.title}
                              <span className="register-table__muted">
                                {ITEM_TYPE_LABELS[item.type]}
                                {item.epicCode && ` · épopée ${item.epicCode}`}
                                {item.requirementCode && ` · exigence ${item.requirementCode}`}
                                {item.wbsCode && ` · lot ${item.wbsCode} ${data.references.workPackages[item.wbsCode] ?? ''}`}
                              </span>
                              {item.status === 'DONE' && (
                                <span className="register-table__muted">
                                  Accepté le {formatShortDate(item.doneOn)}
                                  {item.acceptedBy && ` par ${item.acceptedBy.name}`}
                                </span>
                              )}
                              {item.refusal && (
                                <span className="backlog-refusal">
                                  Refusé le {formatShortDate(item.refusal.on)} par {item.refusal.by} : {item.refusal.reason}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge status-badge--${PRIORITY_MODIFIERS[item.priority]}`}>
                                {PRIORITY_LABELS[item.priority]}
                              </span>
                            </td>
                            <td>
                              {epic
                                ? `${epic.donePoints} / ${epic.points} pts · ${epic.items} élément(s)`
                                : formatPoints(item.points)}
                            </td>
                            {tab !== 'epics' && (
                              <td>
                                <span className={`status-badge status-badge--${ITEM_STATUS_MODIFIERS[item.status]}`}>
                                  {ITEM_STATUS_LABELS[item.status]}
                                </span>
                                {rights.decide && <BacklogDecision projectId={projectId} item={item} onDecided={reload} />}
                              </td>
                            )}
                            {tab !== 'epics' && <td>{iterationName(item.iterationCode)}</td>}
                            {tab !== 'epics' && (
                              <td>
                                <PersonName id={item.assigneeId} />
                              </td>
                            )}
                            {canEdit && <EditCell label={item.code} onEdit={() => setEditing({ key: item.code, type: item.type })} />}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Tabs>
          </section>
          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">Définition de « terminé »</h2>
            </div>
            <p className="doc-text">{data.definitionOfDone || 'Non rédigée : elle se rédige dans le plan de management du projet (approche de développement).'}</p>
            <button type="button" className="ref-link" onClick={() => onNavigate('project-management-plan')}>
              Plan de management du projet →
            </button>
          </section>
        </article>
      )}
    </>
  );
}
