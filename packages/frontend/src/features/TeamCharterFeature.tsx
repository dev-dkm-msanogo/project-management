import { teamCharterApi } from '@/api/project-documents';
import { TeamCharterEditor } from '@/components/resources/editor/TeamCharterEditor';
import { TeamCharterView } from '@/components/resources/TeamCharterView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useTeamCharter } from '@/hooks/useProjectDocuments';
import { blankTeamCharter, teamCharterDtoToInput } from '@/lib/resource-format';

/** Page « Charte de l'équipe » : les règles que l'équipe se donne, et ses signatures. */
export function TeamCharterFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={teamCharterApi}
      deletion={{
        title: "Supprimer la charte de l'équipe ?",
        run: () => teamCharterApi.remove(projectId),
      }}
      resource={useTeamCharter(projectId)}
      toInput={teamCharterDtoToInput}
      blank={blankTeamCharter}
      labels={{
        edit: 'Éditer la charte',
        create: "+ Rédiger la charte de l'équipe",
        loading: "Chargement de la charte de l'équipe…",
        emptyTitle: "La charte de l'équipe n'a pas encore été rédigée",
        emptyText:
          "Elle fixe les valeurs de l'équipe, ses règles de réunion et de communication, la façon de décider et de résoudre les conflits ; chaque membre la signe.",
      }}
      renderView={(charter) => <TeamCharterView charter={charter} projectName={projectName} />}
      renderEditor={(props) => <TeamCharterEditor projectId={projectId} {...props} />}
    />
  );
}
