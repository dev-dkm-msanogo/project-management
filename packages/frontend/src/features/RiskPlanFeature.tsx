import { riskPlanApi } from '@/api/project-documents';
import { RiskPlanEditor } from '@/components/risks/RiskPlanEditor';
import { RiskPlanView } from '@/components/risks/RiskPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useRiskPlan, useRiskRegister } from '@/hooks/useProjectDocuments';
import { blankRiskPlan, riskPlanDtoToInput } from '@/lib/quality-risk-format';
import type { AppView } from '@/navigation/pmp';

interface RiskPlanFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Plan de gestion des risques » : démarche, RBS, réserve, échelles et matrice du registre. */
export function RiskPlanFeature({ projectId, projectName, onNavigate }: RiskPlanFeatureProps) {
  const { data: register } = useRiskRegister(projectId);

  return (
    <DocumentFeature
      projectId={projectId}
      history={riskPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'risk-plan', component: true }}
      deletion={{
        title: 'Supprimer le plan de gestion des risques ?',
        run: () => riskPlanApi.remove(projectId),
      }}
      resource={useRiskPlan(projectId)}
      toInput={riskPlanDtoToInput}
      blank={blankRiskPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan de gestion des risques',
        loading: 'Chargement du plan de gestion des risques…',
        emptyTitle: "Le plan de gestion des risques n'a pas encore été rédigé",
        emptyText:
          "Stratégie et méthodologie, rôles, catégories de risques, financement et réserve, calendrier, tolérances, définitions de la probabilité et de l'impact.",
      }}
      renderView={(plan) => (
        <RiskPlanView plan={plan} projectName={projectName} risks={register?.risks ?? []} onNavigate={onNavigate} />
      )}
      renderEditor={(props) => <RiskPlanEditor projectId={projectId} {...props} />}
    />
  );
}
