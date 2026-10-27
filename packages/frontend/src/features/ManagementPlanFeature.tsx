import { MANAGEMENT_PLAN_CATALOG, type ManagementPlanKind } from '@shared/index';
import { managementPlansApi } from '@/api/project-documents';
import { ManagementPlanEditor } from '@/components/management-plans/ManagementPlanEditor';
import { ManagementPlanView } from '@/components/management-plans/ManagementPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useManagementPlans } from '@/hooks/useProjectDocuments';
import { todayIso } from '@/lib/format';

interface ManagementPlanFeatureProps {
  projectId: string;
  projectName: string;
  kind: ManagementPlanKind;
}

/** Page d'un plan de gestion rédigé (périmètre, exigences…), décrit par le catalogue des templates. */
export function ManagementPlanFeature({ projectId, projectName, kind }: ManagementPlanFeatureProps) {
  const resource = useManagementPlans(projectId);
  const definition = MANAGEMENT_PLAN_CATALOG[kind];
  const name = definition.title.charAt(0).toLowerCase() + definition.title.slice(1);

  return (
    <DocumentFeature
      projectId={projectId}
      history={{
        versions: managementPlansApi.versions,
        // Ce plan dans la version choisie du document des plans de gestion.
        fetchVersion: async (id, version) => {
          const plan = (await managementPlansApi.fetchVersion(id, version)).plans[kind];
          if (!plan) throw new Error(`Le ${name} n'existait pas encore dans la version ${version}.`);
          return plan;
        },
      }}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'management-plans', component: true }}
      deletion={{
        title: `Supprimer le ${name} ?`,
        message: 'Le plan et toutes ses rubriques seront supprimés définitivement, pour tous les utilisateurs du projet. Les autres plans de gestion ne changent pas.',
        run: async () => {
          const { [kind]: _removed, ...others } = resource.data?.plans ?? {};
          await managementPlansApi.save(projectId, { plans: others });
        },
      }}
      resource={{ ...resource, data: resource.data?.plans[kind] ?? null }}
      toInput={(plan) => structuredClone(plan)}
      blank={() => ({ preparedOn: todayIso(), sections: {} })}
      labels={{
        edit: 'Éditer le plan',
        create: `+ Rédiger le ${name}`,
        loading: 'Chargement du plan…',
        emptyTitle: `Le ${name} n'a pas encore été rédigé`,
        emptyText: `Il couvre : ${definition.sections.map((section) => section.label).join(' · ')}.`,
      }}
      renderView={(plan) => <ManagementPlanView definition={definition} plan={plan} projectName={projectName} />}
      renderEditor={(props) => (
        <ManagementPlanEditor
          definition={definition}
          // Les autres plans du projet sont conservés tels quels.
          save={(plan) => managementPlansApi.save(projectId, { plans: { ...resource.data?.plans, [kind]: plan } })}
          {...props}
        />
      )}
    />
  );
}
