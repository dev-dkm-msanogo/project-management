import { scopeStatementApi } from '@/api/project-documents';
import { ScopeStatementEditor } from '@/components/scope/ScopeStatementEditor';
import { ScopeStatementView } from '@/components/scope/ScopeStatementView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useProjectCharter, useScopeStatement } from '@/hooks/useProjectDocuments';
import { blankScopeStatement, scopeStatementDtoToInput } from '@/lib/scope-format';
import type { AppView } from '@/navigation/pmp';

interface ScopeStatementFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Énoncé du périmètre » : ce que le projet livre, comment c'est accepté, ce qui est exclu. */
export function ScopeStatementFeature({ projectId, projectName, onNavigate }: ScopeStatementFeatureProps) {
  const { data: charter } = useProjectCharter(projectId);

  return (
    <DocumentFeature
      projectId={projectId}
      history={scopeStatementApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'scope-statement', component: true }}
      deletion={{
        title: "Supprimer l'énoncé du périmètre ?",
        run: () => scopeStatementApi.remove(projectId),
      }}
      resource={useScopeStatement(projectId)}
      toInput={scopeStatementDtoToInput}
      blank={() => blankScopeStatement(charter)}
      labels={{
        edit: "Éditer l'énoncé",
        create: "+ Rédiger l'énoncé du périmètre",
        loading: "Chargement de l'énoncé du périmètre…",
        emptyTitle: "L'énoncé du périmètre n'a pas encore été rédigé",
        emptyText: `Il détaille les livrables, les critères d'acceptation du produit et les exclusions${
          charter ? ', à partir de la charte du projet' : ''
        }.`,
      }}
      renderView={(statement) => (
        <ScopeStatementView statement={statement} projectName={projectName} onNavigate={onNavigate} />
      )}
      renderEditor={(props) => <ScopeStatementEditor projectId={projectId} fromCharter={charter !== null} {...props} />}
    />
  );
}
