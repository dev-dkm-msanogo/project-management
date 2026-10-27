import type { StakeholderDto } from '@shared/index';
import { engagementPlanApi } from '@/api/project-documents';
import { EngagementPlanEditor } from '@/components/communication/EngagementPlanEditor';
import { EngagementPlanView } from '@/components/communication/EngagementPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useEngagementPlan, useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { blankEngagementPlan, engagementPlanDtoToInput } from '@/lib/communication-format';
import type { AppView } from '@/navigation/pmp';

interface EngagementPlanFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Du plus influent au moins influent (comme la charte et le plan). */
const byInfluence = (a: StakeholderDto, b: StakeholderDto) =>
  b.power + b.interest - (a.power + a.interest) || a.code.localeCompare(b.code);

/** Page « Plan d'engagement des parties prenantes » : matrice issue du registre et approches. */
export function EngagementPlanFeature({ projectId, projectName, onNavigate }: EngagementPlanFeatureProps) {
  const { data: register } = useStakeholderRegister(projectId);
  const stakeholders = [...(register?.stakeholders ?? [])].sort(byInfluence);

  return (
    <DocumentFeature
      projectId={projectId}
      history={engagementPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'engagement-plan', component: true }}
      deletion={{
        title: "Supprimer le plan d'engagement des parties prenantes ?",
        run: () => engagementPlanApi.remove(projectId),
      }}
      resource={useEngagementPlan(projectId)}
      toInput={engagementPlanDtoToInput}
      blank={() => blankEngagementPlan(stakeholders)}
      labels={{
        edit: 'Éditer le plan',
        create: "+ Rédiger le plan d'engagement",
        loading: "Chargement du plan d'engagement…",
        emptyTitle: "Le plan d'engagement des parties prenantes n'a pas encore été rédigé",
        emptyText:
          stakeholders.length > 0
            ? `Il part des ${stakeholders.length} parties prenantes du registre et de leur stratégie : précisez pour chacune l'approche, les besoins d'information, la fréquence et le moyen.`
            : "Identifiez d'abord les parties prenantes dans leur registre : le plan s'appuie sur leur engagement actuel et souhaité.",
      }}
      renderView={(plan) => <EngagementPlanView plan={plan} projectName={projectName} onNavigate={onNavigate} />}
      renderEditor={(props) => <EngagementPlanEditor projectId={projectId} stakeholders={stakeholders} {...props} />}
    />
  );
}
