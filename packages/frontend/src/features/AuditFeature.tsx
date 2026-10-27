import { useCallback, useEffect, useState } from 'react';
import type { AuditEventDto } from '@shared/index';
import { fetchAuditLog } from '@/api/governance-client';
import { useAuth } from '@/auth/AuthContext';
import { formatDateTime } from '@/lib/admin-format';

/** Journal d'audit de la plateforme (administrateurs) : qui a fait quoi, et quand, dans tous les projets. */
export function AuditFeature() {
  const { canAdminister } = useAuth();
  const [events, setEvents] = useState<AuditEventDto[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });

  const load = useCallback(
    async (before: number | null) => {
      setStatus({ loading: true, error: null });
      try {
        const page = await fetchAuditLog(before);
        setEvents((current) => (before ? [...current, ...page.events] : page.events));
        setNextBefore(page.nextBefore);
        setStatus({ loading: false, error: null });
      } catch (error) {
        setStatus({ loading: false, error: error instanceof Error ? error.message : 'Erreur inconnue.' });
      }
    },
    [],
  );

  useEffect(() => {
    if (canAdminister) void load(null);
  }, [load, canAdminister]);

  if (!canAdminister) return <p className="app__status">Le journal d'audit est réservé aux administrateurs.</p>;

  return (
    <>
      <article className="doc-page doc-page--wide">
        <section className="doc-panel">
          <h2 className="doc-subtitle">Tous les projets, comptes et connexions</h2>
          {status.error && <p className="app__status app__status--error">{status.error}</p>}
          {!status.loading && events.length === 0 && !status.error && <p className="app__status">Aucune action enregistrée.</p>}
          {events.length > 0 && (
            <div className="wbs-scroll">
              <table className="register-table audit-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Compte</th>
                    <th>Projet</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="audit-table__when">{formatDateTime(event.at)}</td>
                      <td>{event.userName ?? 'Compte inconnu'}</td>
                      <td>{event.projectName ?? event.projectId ?? '—'}</td>
                      <td>
                        {event.action}
                        {event.detail && <span className="audit-table__detail">{event.detail}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status.loading && <p className="app__status">Chargement du journal…</p>}
          {nextBefore && !status.loading && (
            <button type="button" className="btn btn--ghost audit-more" onClick={() => void load(nextBefore)}>
              Afficher les actions plus anciennes
            </button>
          )}
        </section>
      </article>
    </>
  );
}
