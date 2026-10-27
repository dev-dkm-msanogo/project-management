import type { StakeholderDto } from '@shared/index';
import { SummaryTiles } from '@/components/ui/SummaryTiles';

/** Indicateurs clés du registre des parties prenantes. */
export function StakeholderSummary({ stakeholders }: { stakeholders: StakeholderDto[] }) {
  const count = (predicate: (stakeholder: StakeholderDto) => boolean) => stakeholders.filter(predicate).length;
  return (
    <SummaryTiles
      tiles={[
        { label: 'Parties prenantes', value: stakeholders.length },
        { label: 'À gérer étroitement', value: count((s) => s.quadrant === 'MANAGE_CLOSELY') },
        { label: 'Engagement à faire progresser', value: count((s) => s.engagementGap > 0), tone: 'warning' },
        { label: 'Réfractaires', value: count((s) => s.currentEngagement === 'RESISTANT'), tone: 'danger' },
        { label: 'Non informées', value: count((s) => s.currentEngagement === 'UNAWARE'), tone: 'alert' },
      ]}
    />
  );
}
