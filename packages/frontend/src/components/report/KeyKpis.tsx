import type { KpiDto } from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';

/** Section 11 — Indicateurs clés (KPIs). */
export function KeyKpis({ kpis }: { kpis: KpiDto[] }) {
  return (
    <SectionCard number={11} title="Indicateurs clés (KPIs)" className="col-12" source="Calculés à partir du projet, puis indicateurs saisis">
      <div className="kpis">
        {kpis.map((kpi) => (
          <div className={`kpi${kpi.computed ? '' : ' kpi--manual'}`} key={kpi.key}>
            <p className="kpi__value">{kpi.value}</p>
            <p className="kpi__label">{kpi.label}</p>
            {kpi.hint && <p className="kpi__hint">{kpi.hint}</p>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
