import type {
  ChangeBucketDto,
  ChangeSummaryDto,
} from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatDaysSigned, formatSignedMillions } from '@/lib/format';

function Bucket({
  bucket,
  label,
  modifier,
}: {
  bucket: ChangeBucketDto;
  label: string;
  modifier: 'green' | 'amber' | 'grey';
}) {
  return (
    <div className={`bucket bucket--${modifier}`}>
      <p className="bucket__value">{bucket.count}</p>
      <p className="bucket__label">{label}</p>
      <p className="bucket__impact">{formatSignedMillions(bucket.impact)}</p>
    </div>
  );
}

/** Section 9 — Synthèse des changements. */
export function ChangeSummaryCard({ changeSummary }: { changeSummary: ChangeSummaryDto }) {
  return (
    <SectionCard
      number={9}
      title="Synthèse des changements"
      className="col-5"
      source="Registre des modifications, demandes connues à la date du rapport"
    >
      <div className="changes">
        <div className="changes__buckets">
          <Bucket bucket={changeSummary.approved} label="Approuvés" modifier="green" />
          <Bucket bucket={changeSummary.pending} label="En attente" modifier="amber" />
          <Bucket bucket={changeSummary.rejected} label="Rejetés" modifier="grey" />
        </div>
        <div className="changes__net">
          <span>
            Impact des approuvés (coût) :{' '}
            <strong>{formatSignedMillions(changeSummary.netCostImpact)}</strong>
          </span>
          <span>
            Impact des approuvés (délai) :{' '}
            <strong>{formatDaysSigned(changeSummary.netScheduleImpactDays)}</strong>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
