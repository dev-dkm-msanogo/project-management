import type { ReportHeaderDto } from '@shared/contracts/executive-status-report';
import { formatLongDate, formatShortDate } from '@/lib/format';

export function ReportHeader({ header }: { header: ReportHeaderDto }) {
  return (
    <header className="report__header col-12">
      <div className="report__title-block">
        <h1 className="report__project">{header.projectName}</h1>
        <p className="report__subtitle">{header.reportTitle}</p>
      </div>
      <dl className="report__meta">
        <div>
          <dt>Période de reporting</dt>
          <dd>
            {formatLongDate(header.reportingPeriod.from)} – {formatLongDate(header.reportingPeriod.to)}
          </dd>
        </div>
        <div>
          <dt>Date du rapport</dt>
          <dd>{formatLongDate(header.reportDate)}</dd>
        </div>
        <div>
          <dt>Avancement mesuré</dt>
          <dd>{header.progressMeasuredOn ? `au ${formatShortDate(header.progressMeasuredOn)}` : 'jamais'}</dd>
        </div>
      </dl>
      {header.progressStale && (
        <p className="report__stale" role="note">
          Aucune mesure d'avancement pendant la période : délai et valeur acquise reposent sur des données anciennes.
        </p>
      )}
    </header>
  );
}
