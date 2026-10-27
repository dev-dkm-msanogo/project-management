import type { PriorityDto } from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';

/** Section 10 — Priorités de la période suivante. */
export function NextPeriodPriorities({ priorities }: { priorities: PriorityDto[] }) {
  return (
    <SectionCard number={10} title="Priorités de la période suivante" className="col-7">
      <ul className="priorities">
        {priorities.map((priority, index) => (
          <li key={index}>
            <span className="priorities__check" aria-hidden="true">
              ✓
            </span>
            {priority.description}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
