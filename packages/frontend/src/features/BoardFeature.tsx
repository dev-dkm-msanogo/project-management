import { useEffect, useState } from 'react';
import { BACKLOG_STATUSES, type BacklogItemStatus } from '@shared/index';
import { backlogApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { PageActions } from '@/components/header/PageActions';
import { PersonName } from '@/components/people/People';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useProductBacklog } from '@/hooks/useProjectDocuments';
import { formatPoints, ITEM_STATUS_LABELS, ITEM_TYPE_LABELS, productBacklogDtoToInput, withStatus } from '@/lib/agile-format';
import { PRIORITY_LABELS } from '@/lib/requirements-format';
import type { AppView } from '@/navigation/pmp';

interface BoardFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/**
 * Page « Tableau de suivi » : les éléments de l'itération, colonne par statut. Un élément se
 * déplace par glisser-déposer ou par ses flèches ; « Terminé » le date du jour.
 */
export function BoardFeature({ projectId, onNavigate }: BoardFeatureProps) {
  const { data, loading, error, reload } = useProductBacklog(projectId);
  const { canEdit } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);

  useEffect(() => setSelected(null), [projectId]);

  const iterations = data?.iterations ?? [];
  const iteration =
    iterations.find((entry) => entry.code === selected) ??
    iterations.find((entry) => entry.code === data?.metrics.currentIteration) ??
    iterations.find((entry) => entry.state === 'PLANNED') ??
    iterations.at(-1);
  const items = (data?.items ?? []).filter((item) => item.type !== 'EPIC' && iteration && item.iterationCode === iteration.code);

  const moveTo = async (code: string, status: BacklogItemStatus) => {
    if (!data || saving) return;
    const input = productBacklogDtoToInput(data);
    const item = input.items.find((entry) => entry.code === code);
    if (!item || item.status === status) return;
    setSaving(true);
    setSaveError(null);
    try {
      await backlogApi.save(projectId, {
        ...input,
        items: input.items.map((entry) => (entry.code === code ? withStatus(entry, status) : entry)),
      });
      reload();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageActions>
        {iterations.length > 0 && (
          <select
            className="form-input report-period"
            aria-label="Itération affichée"
            value={iteration?.code ?? ''}
            onChange={(event) => setSelected(event.target.value)}
          >
            {iterations.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name} · {entry.code}
              </option>
            ))}
          </select>
        )}
        {!canEdit && <ReadOnlyBadge />}
      </PageActions>

      {loading && <p className="app__status">Chargement du tableau…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {saveError && (
        <p className="app__status app__status--error" role="alert">
          {saveError}
        </p>
      )}
      {data && !iteration && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Aucune itération</h2>
            <p className="empty-state__text">Le tableau montre les éléments engagés dans une itération : planifiez-en une d'abord.</p>
            <button type="button" className="ref-link" onClick={() => onNavigate('iterations')}>
              Itérations →
            </button>
          </section>
        </div>
      )}
      {data && iteration && (
        <div className="board" aria-busy={saving}>
          {BACKLOG_STATUSES.map((status, column) => {
            const cards = items.filter((item) => item.status === status);
            const points = cards.reduce((sum, item) => sum + (item.points ?? 0), 0);
            return (
              <section
                key={status}
                className={`board__column${dragged ? ' board__column--droppable' : ''}`}
                aria-label={ITEM_STATUS_LABELS[status]}
                onDragOver={(event) => {
                  if (canEdit && dragged) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragged) void moveTo(dragged, status);
                  setDragged(null);
                }}
              >
                <header className="board__head">
                  <h2>{ITEM_STATUS_LABELS[status]}</h2>
                  <span>
                    {cards.length} · {points} pts
                  </span>
                </header>
                <ul className="board__cards">
                  {cards.map((item) => (
                    <li
                      key={item.code}
                      className="board-card"
                      draggable={canEdit && !saving}
                      onDragStart={() => setDragged(item.code)}
                      onDragEnd={() => setDragged(null)}
                    >
                      <div className="board-card__top">
                        <span className="register-table__code">{item.code}</span>
                        <span className="board-card__points">{formatPoints(item.points)}</span>
                      </div>
                      <p className="board-card__title">{item.title}</p>
                      <p className="board-card__meta">
                        {ITEM_TYPE_LABELS[item.type]} · {PRIORITY_LABELS[item.priority]}
                        {item.epicCode && ` · ${item.epicCode}`}
                      </p>
                      <div className="board-card__bottom">
                        <span className="board-card__person">
                          <PersonName id={item.assigneeId} empty="Non affecté" />
                        </span>
                        {canEdit && (
                          <span className="board-card__moves">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={column === 0 || saving}
                              aria-label={`${item.code} : passer à « ${ITEM_STATUS_LABELS[BACKLOG_STATUSES[column - 1] ?? status]} »`}
                              onClick={() => void moveTo(item.code, BACKLOG_STATUSES[column - 1]!)}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={column === BACKLOG_STATUSES.length - 1 || saving}
                              aria-label={`${item.code} : passer à « ${ITEM_STATUS_LABELS[BACKLOG_STATUSES[column + 1] ?? status]} »`}
                              onClick={() => void moveTo(item.code, BACKLOG_STATUSES[column + 1]!)}
                            >
                              →
                            </button>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
