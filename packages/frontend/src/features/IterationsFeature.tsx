import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { BurndownChart } from '@/components/agile/AgileCharts';
import { IterationEditor } from '@/components/agile/IterationEditor';
import { PageActions } from '@/components/header/PageActions';
import { PersonName } from '@/components/people/People';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useProductBacklog } from '@/hooks/useProjectDocuments';
import {
  formatPoints,
  ITEM_STATUS_LABELS,
  ITEM_STATUS_MODIFIERS,
  ITERATION_STATE_LABELS,
  ITERATION_STATE_MODIFIERS,
} from '@/lib/agile-format';
import { formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface IterationsFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Itérations » : calendrier des itérations, engagement, burndown, revue et rétrospective. */
export function IterationsFeature({ projectId, onNavigate }: IterationsFeatureProps) {
  const { data, loading, error, reload } = useProductBacklog(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<{ key: string | null } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setEditing(null);
    setSelected(null);
  }, [projectId]);

  if (editing && data) {
    return (
      <IterationEditor
        projectId={projectId}
        backlog={data}
        target={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    );
  }

  const iterations = data?.iterations ?? [];
  const current =
    iterations.find((iteration) => iteration.code === selected) ??
    iterations.find((iteration) => iteration.code === data?.metrics.currentIteration) ??
    iterations.at(-1);
  const items = (data?.items ?? []).filter((item) => current && item.iterationCode === current.code);

  return (
    <>
      <PageActions>
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
              + Nouvelle itération
            </button>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement des itérations…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && iterations.length === 0 && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Aucune itération planifiée</h2>
            <p className="empty-state__text">
              Une itération est une période fixe (souvent deux semaines) avec un objectif : l'équipe s'engage sur des
              éléments du carnet, les réalise, les montre en revue, puis tire les leçons en rétrospective.
            </p>
          </section>
        </div>
      )}
      {data && current && (
        <article className="doc-page">
          <ol className="iteration-strip" aria-label="Itérations">
            {iterations.map((iteration) => (
              <li key={iteration.code}>
                <button
                  type="button"
                  className={`iteration-card${iteration.code === current.code ? ' iteration-card--active' : ''}`}
                  aria-pressed={iteration.code === current.code}
                  onClick={() => setSelected(iteration.code)}
                >
                  <span className="iteration-card__head">
                    <strong>{iteration.name}</strong>
                    <span className={`status-badge status-badge--${ITERATION_STATE_MODIFIERS[iteration.state]}`}>
                      {ITERATION_STATE_LABELS[iteration.state]}
                    </span>
                  </span>
                  <span className="iteration-card__dates">
                    {formatShortDate(iteration.start)} → {formatShortDate(iteration.end)}
                  </span>
                  <span className="iteration-card__points">
                    {iteration.donePoints} / {iteration.committedPoints} pts
                    {iteration.capacity !== null && ` · capacité ${iteration.capacity}`}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">
                {current.name} <span className="register-table__code">{current.code}</span>
              </h2>
              {canEdit && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing({ key: current.code })}>
                  Modifier
                </button>
              )}
            </div>
            <p className="doc-text">{current.goal || 'Objectif non précisé.'}</p>
            {current.capacity !== null && current.committedPoints > current.capacity && (
              <p className="entry-form__warning" role="note">
                Engagement ({current.committedPoints} pts) au-delà de la capacité de l'équipe ({current.capacity} pts).
              </p>
            )}
            <h3 className="doc-subtitle">Burndown</h3>
            <BurndownChart points={current.burndown} />
          </section>

          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">Éléments engagés ({items.length})</h2>
              <div className="doc-links">
                <button type="button" className="ref-link" onClick={() => onNavigate('board')}>
                  Tableau de suivi →
                </button>
                <button type="button" className="ref-link" onClick={() => onNavigate('backlog')}>
                  Carnet de produit →
                </button>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="plan__empty">Aucun élément : planifiez-en depuis le carnet de produit.</p>
            ) : (
              <div className="wbs-scroll">
                <table className="register-table">
                  <thead>
                    <tr>
                      <th>Élément</th>
                      <th>Points</th>
                      <th>Statut</th>
                      <th>Affecté à</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.code}>
                        <td className="register-table__title">
                          <span className="register-table__code">{item.code}</span> {item.title}
                        </td>
                        <td>{formatPoints(item.points)}</td>
                        <td>
                          <span className={`status-badge status-badge--${ITEM_STATUS_MODIFIERS[item.status]}`}>
                            {ITEM_STATUS_LABELS[item.status]}
                          </span>
                        </td>
                        <td>
                          <PersonName id={item.assigneeId} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">Revue et rétrospective</h2>
            </div>
            <h3 className="doc-subtitle">Revue</h3>
            <p className="doc-text">{current.review || '—'}</p>
            <div className="doc-columns">
              <div>
                <h3 className="doc-subtitle">Ce qui a bien marché</h3>
                <p className="doc-text">{current.wentWell || '—'}</p>
              </div>
              <div>
                <h3 className="doc-subtitle">À améliorer</h3>
                <p className="doc-text">{current.toImprove || '—'}</p>
              </div>
            </div>
            <h3 className="doc-subtitle">Actions retenues</h3>
            {current.actions.length === 0 ? (
              <p className="plan__empty">Aucune.</p>
            ) : (
              <ul className="doc-list">
                {current.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            )}
            <button type="button" className="ref-link" onClick={() => onNavigate('lessons-learned')}>
              Registre des leçons apprises →
            </button>
          </section>
        </article>
      )}
    </>
  );
}
