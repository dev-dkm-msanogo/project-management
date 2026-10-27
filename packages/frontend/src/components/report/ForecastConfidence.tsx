import type { ForecastDto } from '@shared/contracts/executive-status-report';
import { Gauge } from '@/components/ui/Gauge';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatLongDate } from '@/lib/format';

/** Section 12 — Prévision & confiance de livraison. */
export function ForecastConfidence({ forecast }: { forecast: ForecastDto }) {
  return (
    <SectionCard
      number={12}
      title="Prévision / Confiance de livraison"
      className="col-12"
      source="Fin prévue de la WBS, corrigée par l'indice de délai (SPI) ; confiance du chef de projet"
    >
      <div className="forecast">
        <div className="forecast__date">
          <p className="forecast__label">{forecast.forecastLabel}</p>
          <p className="forecast__value">{forecast.forecastDate ? formatLongDate(forecast.forecastDate) : '—'}</p>
          {forecast.plannedDate && (
            <p className={`forecast__plan ${forecast.onPlan ? 'is-on-plan' : 'is-off-plan'}`}>
              Fin prévue : {formatLongDate(forecast.plannedDate)}
            </p>
          )}
        </div>
        <div className="forecast__gauge">
          <Gauge
            value={forecast.confidencePercentage}
            primary={`${forecast.confidencePercentage}%`}
            secondary={forecast.confidenceLabel}
          />
        </div>
        <p className="forecast__statement">{forecast.statement}</p>
      </div>
    </SectionCard>
  );
}
