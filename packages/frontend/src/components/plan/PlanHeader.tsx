import type { ProjectPlanDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { formatLongDate } from '@/lib/format';

/** En-tête du plan : intitulé, chef de projet, bornes et durée (réutilisé par WBS et Gantt). */
export function PlanHeader({ plan }: { plan: ProjectPlanDto }) {
  return (
    <header className="plan__header">
      <div className="plan__field plan__field--wide">
        <span className="plan__label">Intitulé du projet</span>
        <span className="plan__value plan__value--title">{plan.title}</span>
      </div>
      <div className="plan__field plan__field--wide">
        <span className="plan__label">Chef de projet</span>
        <span className="plan__value">
          <PersonName id={plan.managerId} />
        </span>
      </div>
      <div className="plan__field">
        <span className="plan__label">Date de début</span>
        <span className="plan__value">{plan.startDate ? formatLongDate(plan.startDate) : '—'}</span>
      </div>
      <div className="plan__field">
        <span className="plan__label">Date de fin</span>
        <span className="plan__value">{plan.endDate ? formatLongDate(plan.endDate) : '—'}</span>
      </div>
      <div className="plan__field plan__field--duration">
        <span className="plan__label">Durée (jours)</span>
        <span className="plan__value plan__value--duration">{plan.durationDays ?? '—'}</span>
      </div>
    </header>
  );
}
