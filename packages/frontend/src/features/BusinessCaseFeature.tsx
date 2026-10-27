import { businessCaseApi } from '@/api/project-documents';
import { BusinessCaseEditor } from '@/components/business-case/BusinessCaseEditor';
import { BusinessCaseView } from '@/components/business-case/BusinessCaseView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useBusinessCase } from '@/hooks/useProjectDocuments';
import { blankBusinessCase, businessCaseDtoToInput } from '@/lib/business-case-format';

/** Page « Business case » : justification économique du projet. */
export function BusinessCaseFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={businessCaseApi}
      approval={{ subject: 'BUSINESS_CASE', segment: 'business-case' }}
      deletion={{
        title: 'Supprimer le business case ?',
        run: () => businessCaseApi.remove(projectId),
      }}
      resource={useBusinessCase(projectId)}
      toInput={businessCaseDtoToInput}
      blank={blankBusinessCase}
      labels={{
        edit: 'Éditer le business case',
        create: '+ Rédiger le business case',
        loading: 'Chargement du business case…',
        emptyTitle: "Le business case de ce projet n'a pas encore été rédigé",
        emptyText:
          'Il justifie le projet : besoin métier, alternatives étudiées, solution recommandée, coûts et bénéfices sur trois ans.',
      }}
      renderView={(document) => <BusinessCaseView document={document} projectName={projectName} />}
      renderEditor={(props) => <BusinessCaseEditor projectId={projectId} {...props} />}
    />
  );
}
