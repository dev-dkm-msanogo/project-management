import { useState } from 'react';
import type { ExecutiveStatusReportInput, RagLevel } from '@shared/index';
import { saveExecutiveReport } from '@/api/report-client';
import { DecisionsEditor } from '@/components/editor/sections/DecisionsEditor';
import { ForecastEditor } from '@/components/editor/sections/ForecastEditor';
import { GeneralFields } from '@/components/editor/sections/GeneralFields';
import { KpisEditor } from '@/components/editor/sections/KpisEditor';
import { PrioritiesEditor } from '@/components/editor/sections/PrioritiesEditor';
import { EditorShell } from '@/components/form/EditorShell';

interface ReportEditorProps {
  mode: 'edit' | 'create';
  projectId: string;
  initialInput: ExecutiveStatusReportInput;
  /** Niveau global calculé du rapport enregistré (absent à la création). */
  computedRag?: RagLevel | null;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Rédaction du rapport exécutif : seules ses parties de jugement. Jalons, périmètre, délai, coût,
 * risques, changements, décisions des registres, indicateurs et date prévue sont calculés à la date
 * du rapport à partir des éléments du projet.
 */
export function ReportEditor({ mode, projectId, initialInput, computedRag = null, onCancel, onSaved }: ReportEditorProps) {
  const [input, setInput] = useState<ExecutiveStatusReportInput>(initialInput);
  const patch = (partial: Partial<ExecutiveStatusReportInput>) => setInput((previous) => ({ ...previous, ...partial }));

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau rapport' : 'Éditer le rapport'}
      save={() => saveExecutiveReport(projectId, input, mode === 'create')}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        Jalons, périmètre, délai, coût, risques, changements, décisions des registres, indicateurs et date de
        livraison prévue sont calculés à la date du rapport à partir des éléments du projet : pour les faire évoluer,
        mettez à jour l'échéancier, les registres, l'avancement ou les dépenses.
      </p>
      <GeneralFields input={input} patch={patch} computedRag={computedRag} />
      <DecisionsEditor value={input.decisions} onChange={(decisions) => patch({ decisions })} />
      <PrioritiesEditor value={input.priorities} onChange={(priorities) => patch({ priorities })} />
      <KpisEditor value={input.kpis} onChange={(kpis) => patch({ kpis })} />
      <ForecastEditor value={input.forecast} onChange={(forecast) => patch({ forecast })} />
    </EditorShell>
  );
}
