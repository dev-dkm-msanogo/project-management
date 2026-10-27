import { raciApi } from '@/api/project-documents';
import { RaciEditor } from '@/components/raci/RaciEditor';
import { RaciView } from '@/components/raci/RaciView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useResponsibilityMatrix } from '@/hooks/useProjectDocuments';
import { blankRaci, raciDtoToInput } from '@/lib/raci-format';

/** Page « Matrice RACI » : qui réalise, rend compte, est consulté ou informé, par activité. */
export function RaciFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={raciApi}
      deletion={{
        title: 'Supprimer la matrice RACI ?',
        run: () => raciApi.remove(projectId),
      }}
      resource={useResponsibilityMatrix(projectId)}
      toInput={raciDtoToInput}
      blank={blankRaci}
      labels={{
        edit: 'Éditer la matrice',
        create: '+ Construire la matrice RACI',
        loading: 'Chargement de la matrice RACI…',
        emptyTitle: "La matrice RACI de ce projet n'a pas encore été construite",
        emptyText:
          'Elle indique, pour chaque activité, qui réalise (R), qui rend compte (A, une seule personne), qui est consulté (C) et qui est informé (I).',
      }}
      renderView={(matrix) => <RaciView matrix={matrix} projectName={projectName} />}
      renderEditor={(props) => <RaciEditor projectId={projectId} {...props} />}
    />
  );
}
