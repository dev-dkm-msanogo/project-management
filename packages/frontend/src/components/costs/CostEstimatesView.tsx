import { useState } from 'react';
import type { CostEstimatesDto } from '@shared/index';
import { ActivityCostTable } from '@/components/costs/ActivityCostTable';
import { BasisOfEstimates } from '@/components/costs/BasisOfEstimates';
import { CostSummary } from '@/components/costs/CostSummary';
import { Tabs } from '@/components/ui/Tabs';
import { formatLongDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

type EstimatesTab = 'activities' | 'basis';

interface CostEstimatesViewProps {
  estimates: CostEstimatesDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Estimations des coûts : cascade jusqu'au financement requis, puis activités et base des estimations. */
export function CostEstimatesView({ estimates, projectName, onNavigate }: CostEstimatesViewProps) {
  const [tab, setTab] = useState<EstimatesTab>('activities');
  const detailed = Object.keys(estimates.basisEstimates).length;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(estimates.preparedOn)}</span>
        </div>
        <CostSummary summary={estimates.summary} charterBudget={estimates.charterBudget} />
        <button type="button" className="ref-link" onClick={() => onNavigate('cost-baseline')}>
          Répartition dans le temps (référence des coûts) →
        </button>
      </section>

      <section className="doc-panel">
        <Tabs
          label="Vues des estimations des coûts"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'activities', label: 'Estimations par activité', count: estimates.activities.length },
            { id: 'basis', label: 'Base des estimations', count: detailed || undefined },
          ]}
        >
          {tab === 'activities' &&
            (estimates.activities.length === 0 ? (
              <p className="plan__empty">Aucune activité estimée.</p>
            ) : (
              <ActivityCostTable activities={estimates.activities} />
            ))}
          {tab === 'basis' && (
            <BasisOfEstimates
              activities={estimates.activities}
              basisEstimates={estimates.basisEstimates}
              narrative={estimates.narrative}
            />
          )}
        </Tabs>
      </section>
    </article>
  );
}
