import { charterApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { CharterView } from '@/components/charter/CharterView';
import { CharterEditor } from '@/components/charter/editor/CharterEditor';
import { usePeople } from '@/components/people/People';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useProjectCharter } from '@/hooks/useProjectDocuments';
import { blankCharter, charterDtoToInput } from '@/lib/charter-format';
import type { AppView } from '@/navigation/pmp';

interface CharterFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Charte du projet » : consultation et rédaction ; soumission et approbation par le circuit de validation. */
export function CharterFeature({ projectId, projectName, onNavigate }: CharterFeatureProps) {
  const { user } = useAuth();
  const { resources } = usePeople();
  // Le rédacteur est proposé comme chef de projet : la ressource rattachée à son compte.
  const ownResource = resources.find((resource) => resource.userId === user?.id)?.id ?? '';

  return (
    <DocumentFeature
      projectId={projectId}
      history={charterApi}
      approval={{ subject: 'CHARTER', segment: 'charter' }}
      deletion={{
        title: 'Supprimer la charte du projet ?',
        message:
          'La charte sera supprimée définitivement, pour tous les utilisateurs du projet. Son budget ne sera plus repris par les estimations des coûts ni par la stratégie de financement.',
        run: () => charterApi.remove(projectId),
      }}
      resource={useProjectCharter(projectId)}
      toInput={charterDtoToInput}
      blank={() => blankCharter(ownResource)}
      labels={{
        edit: 'Éditer la charte',
        create: '+ Rédiger la charte',
        loading: 'Chargement de la charte…',
        emptyTitle: "La charte de ce projet n'a pas encore été rédigée",
        emptyText:
          'Elle autorise formellement le projet : objectifs mesurables, périmètre, budget, jalons, sponsor et autorité du chef de projet.',
      }}
      renderView={(charter, context) => (
        <CharterView
          charter={charter}
          projectName={projectName}
          onNavigate={onNavigate}
          approval={context.approval}
          archived={context.archived}
        />
      )}
      renderEditor={(props) => <CharterEditor {...props} projectId={projectId} />}
    />
  );
}
