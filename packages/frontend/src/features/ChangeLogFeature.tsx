import { useEffect, useState } from 'react';
import { decideChangeRequest } from '@/api/approval-client';
import { changeLogApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { DecisionDialog } from '@/components/approval/DecisionDialog';
import { ChangeLogView } from '@/components/changes/ChangeLogView';
import { ChangeRequestEditor } from '@/components/changes/ChangeRequestEditor';
import { ChangeRequestView } from '@/components/changes/ChangeRequestView';
import { PageActions } from '@/components/header/PageActions';
import { VersionHistory } from '@/components/history/VersionHistory';
import { DeleteAction } from '@/components/ui/DeleteAction';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useIsApprover } from '@/hooks/useApprovals';
import { useChangeLog } from '@/hooks/useProjectDocuments';
import { DECISION_CHOICES, awaitsDecision, blankChangeRequest, changeLogDtoToInput, formatCostImpact, formatScheduleImpact } from '@/lib/change-format';
import { nextCode } from '@/lib/codes';

/** Registre, une demande, ou l'éditeur d'une demande (nouvelle : code absent). */
type Screen = { kind: 'log' } | { kind: 'request'; code: string } | { kind: 'edit'; code: string | null };

/**
 * Page « Registre des modifications » : le registre des demandes, chaque demande avec son
 * évaluation et sa décision (prise par un valideur du projet), et leur rédaction une à une.
 */
export function ChangeLogFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useChangeLog(projectId);
  const { canEdit } = useAuth();
  const isApprover = useIsApprover(projectId);
  const [screen, setScreen] = useState<Screen>({ kind: 'log' });
  const [deciding, setDeciding] = useState(false);

  useEffect(() => setScreen({ kind: 'log' }), [projectId]);

  const toLog = () => setScreen({ kind: 'log' });
  const find = (code: string) => data?.requests.find((request) => request.code === code);

  if (screen.kind === 'edit' && data) {
    const input = changeLogDtoToInput(data);
    const existing = screen.code ? input.requests.find((request) => request.code === screen.code) : undefined;
    return (
      <ChangeRequestEditor
        projectId={projectId}
        log={input}
        initialInput={existing ?? blankChangeRequest(nextCode(input.requests, 'CR'))}
        isNew={!existing}
        onCancel={() => setScreen(existing ? { kind: 'request', code: existing.code } : { kind: 'log' })}
        onSaved={(code) => {
          setScreen({ kind: 'request', code });
          reload();
        }}
      />
    );
  }

  const request = screen.kind === 'request' ? find(screen.code) : undefined;

  const remove = async () => {
    if (!data || !request) return;
    const input = changeLogDtoToInput(data);
    await changeLogApi.save(projectId, { requests: input.requests.filter((item) => item.code !== request.code) });
    toLog();
    reload();
  };

  return (
    <>
      <PageActions>
        {/* Historique consultable ; pas de restauration : une demande décidée est figée et jamais retirée. */}
        {!request && data && <VersionHistory projectId={projectId} api={changeLogApi} canRestore={false} onRestore={() => {}} />}
        {request && (
          <button type="button" className="btn btn--ghost" onClick={toLog}>
            ← Registre
          </button>
        )}
        {request && isApprover && awaitsDecision(request) && (
          <button type="button" className="btn btn--primary" onClick={() => setDeciding(true)}>
            Décider
          </button>
        )}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : request ? (
          <>
            {/* Une demande décidée reste au registre : seuls son statut et ses commentaires évoluent. */}
            {!request.disposition && (
              <DeleteAction
                title={`Supprimer ${request.code} ?`}
                message="La demande disparaît du registre. Préférez la faire rejeter si elle a déjà été examinée."
                onDelete={remove}
              />
            )}
            <button type="button" className="btn btn--ghost" onClick={() => setScreen({ kind: 'edit', code: request.code })}>
              {request.disposition ? 'Mettre à jour le suivi' : 'Modifier la demande'}
            </button>
          </>
        ) : (
          data && (
            <button type="button" className="btn btn--primary" onClick={() => setScreen({ kind: 'edit', code: null })}>
              + Nouvelle demande
            </button>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du registre des modifications…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && request && <ChangeRequestView request={request} />}
      {request && (
        <DecisionDialog
          open={deciding}
          title={`Décider de ${request.code}`}
          context={
            <>
              <strong>{request.title}</strong> — coût {formatCostImpact(request.costImpact)}, délai{' '}
              {formatScheduleImpact(request.scheduleImpactDays)}. La décision est datée du jour et signée de votre nom.
            </>
          }
          choiceLabel="Décision"
          choices={DECISION_CHOICES}
          initialChoice="APPROVED"
          confirmLabel="Enregistrer la décision"
          onConfirm={async (disposition, rationale) => {
            await decideChangeRequest(projectId, request.code, { disposition, rationale });
            setDeciding(false);
            reload();
          }}
          onClose={() => setDeciding(false)}
        />
      )}
      {data && !request && (
        <article className="doc-page">
          <ChangeLogView log={data} onOpen={(code) => setScreen({ kind: 'request', code })} />
        </article>
      )}
    </>
  );
}
