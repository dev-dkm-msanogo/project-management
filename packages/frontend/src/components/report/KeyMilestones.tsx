import type {
  MilestoneDto,
  MilestoneState,
} from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatMonthDay } from '@/lib/format';

const STATUS_CONFIG: Record<
  MilestoneState,
  { modifier: string; symbol: string; label: string }
> = {
  COMPLETE: { modifier: 'done', symbol: '✓', label: 'Terminé' },
  IN_PROGRESS: { modifier: 'progress', symbol: '◐', label: 'En cours' },
  NOT_STARTED: { modifier: 'pending', symbol: '•', label: 'À venir' },
  AT_RISK: { modifier: 'risk', symbol: '!', label: 'En retard' },
};

function MilestoneStatusIcon({ state }: { state: MilestoneState }) {
  const config = STATUS_CONFIG[state];
  return (
    <span
      className={`ms-status ms-status--${config.modifier}`}
      title={config.label}
      aria-label={config.label}
    >
      {config.symbol}
    </span>
  );
}

/** Section 3 — Jalons clés. */
export function KeyMilestones({ milestones }: { milestones: MilestoneDto[] }) {
  return (
    <SectionCard number={3} title="Jalons clés" className="col-12" source="Jalons de l'échéancier, à la date du rapport">
      {milestones.length === 0 ? (
        <p className="plan__empty">Aucun jalon : définissez-les dans « Jalons et calendrier ».</p>
      ) : (
      <table className="milestones">
        <thead>
          <tr>
            <th>Jalon</th>
            <th>Prévu</th>
            <th>Réel</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => (
            <tr key={milestone.code ?? milestone.name}>
              <td>{milestone.name}</td>
              <td>{formatMonthDay(milestone.planned)}</td>
              <td>{formatMonthDay(milestone.actual)}</td>
              <td>
                <MilestoneStatusIcon state={milestone.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </SectionCard>
  );
}
