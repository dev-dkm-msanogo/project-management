import { closureReportApi } from '@/api/project-documents';
import { ClosureReportEditor } from '@/components/closing/ClosureReportEditor';
import { ClosureReportView } from '@/components/closing/ClosureReportView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useBenefitsPlan, useClosureReport } from '@/hooks/useProjectDocuments';
import { blankClosureReport, closureReportDtoToInput } from '@/lib/closing-format';
import type { AppView } from '@/navigation/pmp';

interface ClosureReportFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Rapport de clôture » : bilan, transition et acceptation ; son approbation clôt le projet. */
export function ClosureReportFeature({ projectId, projectName, onNavigate }: ClosureReportFeatureProps) {
  const benefits = useBenefitsPlan(projectId).data?.benefits ?? [];
  return (
    <DocumentFeature
      projectId={projectId}
      history={closureReportApi}
      approval={{ subject: 'CLOSURE_REPORT', segment: 'closure-report' }}
      deletion={{
        title: 'Supprimer le rapport de clôture ?',
        run: () => closureReportApi.remove(projectId),
      }}
      resource={useClosureReport(projectId)}
      toInput={closureReportDtoToInput}
      blank={() => blankClosureReport(benefits.map((benefit) => benefit.name))}
      labels={{
        edit: 'Éditer le rapport',
        create: '+ Rédiger le rapport de clôture',
        loading: 'Chargement du rapport de clôture…',
        emptyTitle: "Le rapport de clôture n'a pas encore été rédigé",
        emptyText:
          "Il dresse le bilan du projet (objectifs, écarts, bénéfices, risques), décrit la transition vers l'exploitation et recueille son acceptation. Son approbation clôt le projet.",
      }}
      renderView={(document) => <ClosureReportView report={document} projectName={projectName} onNavigate={onNavigate} />}
      renderEditor={(props) => <ClosureReportEditor projectId={projectId} {...props} />}
    />
  );
}
