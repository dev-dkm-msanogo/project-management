import { useEffect, useState } from 'react';
import { Field } from '@/components/form/Field';
import { DateInput } from '@/components/form/controls';
import { EarnedValueView } from '@/components/performance/EarnedValueView';
import { useEarnedValue } from '@/hooks/usePerformance';
import { formatShortDate, todayIso } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

/**
 * Page « Valeur acquise » : la performance du projet à une date d'état — par défaut la
 * dernière mesure d'avancement — à partir de la WBS, des estimations, de l'avancement et des dépenses.
 */
export function EarnedValueFeature({ projectId, onNavigate }: { projectId: string; onNavigate: (view: AppView) => void }) {
  const [statusDate, setStatusDate] = useState('');
  const { data, loading, error } = useEarnedValue(projectId, statusDate);

  useEffect(() => setStatusDate(''), [projectId]);

  return (
    <>
      {error && <p className="app__status app__status--error">{error}</p>}
      {!loading && !error && data === null && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">La valeur acquise demande une WBS datée et des estimations des coûts</h2>
            <p className="empty-state__text">
              Elle compare ce qui était prévu à la date d'état, ce qui est réalisé et ce qui a été dépensé.
            </p>
            <div className="empty-state__actions">
              <button type="button" className="btn btn--ghost" onClick={() => onNavigate('wbs')}>
                Ouvrir la WBS
              </button>
              <button type="button" className="btn btn--primary" onClick={() => onNavigate('cost-estimates')}>
                Ouvrir les estimations des coûts
              </button>
            </div>
          </section>
        </div>
      )}
      {(data || loading) && (
        <article className="doc-page">
          <section className="doc-panel ev-status">
            <Field
              label="Date d'état"
              hint={
                data
                  ? `Proposée : dernière mesure d'avancement, au ${formatShortDate(data.defaultStatusDate)}.`
                  : 'Chargement…'
              }
            >
              <DateInput value={statusDate || data?.statusDate || null} onChange={(value) => setStatusDate(value && value <= todayIso() ? value : '')} />
            </Field>
            {statusDate && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStatusDate('')}>
                Revenir à la date proposée
              </button>
            )}
            {data && (
              <p className="ev-status__baseline">
                {data.baseline
                  ? `Mesurée contre les références de base approuvées (plan de management, version ${data.baseline.revision} du ${formatShortDate(data.baseline.approvedAt.slice(0, 10))}).`
                  : "Aucune référence de base approuvée : mesure contre la WBS et les estimations en cours."}
              </p>
            )}
          </section>
          {loading && <p className="app__status">Calcul de la valeur acquise…</p>}
          {data && <EarnedValueView value={data} />}
        </article>
      )}
    </>
  );
}
