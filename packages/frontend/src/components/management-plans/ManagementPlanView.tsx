import type { ManagementPlanInput, PlanDefinition } from '@shared/index';
import { TextSections } from '@/components/ui/TextSections';
import { formatLongDate } from '@/lib/format';

interface ManagementPlanViewProps {
  definition: PlanDefinition;
  plan: ManagementPlanInput;
  projectName: string;
}

/** Plan de gestion lu comme son template : une rubrique par section, dans l'ordre du PMI. */
export function ManagementPlanView({ definition, plan, projectName }: ManagementPlanViewProps) {
  const written = definition.sections.filter((section) => plan.sections[section.key]).length;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">
            Préparé le {formatLongDate(plan.preparedOn)} · {written}/{definition.sections.length} sections rédigées
          </span>
        </div>
        <TextSections
          sections={definition.sections.map((section) => ({ ...section, text: plan.sections[section.key] ?? '' }))}
        />
      </section>
    </article>
  );
}
