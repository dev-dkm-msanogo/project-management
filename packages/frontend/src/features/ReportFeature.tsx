import { useEffect, useState } from 'react';
import { deleteExecutiveReport, publishExecutiveReport } from '@/api/report-client';
import { useAuth } from '@/auth/AuthContext';
import { ReportEditor } from '@/components/editor/ReportEditor';
import { PageActions } from '@/components/header/PageActions';
import { ExecutiveReport } from '@/components/report/ExecutiveReport';
import { DeleteAction } from '@/components/ui/DeleteAction';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useExecutiveReport, useExecutiveReports } from '@/hooks/useExecutiveReport';
import { formatDateTime } from '@/lib/admin-format';
import { formatMonth, formatOfMonth, todayIso } from '@/lib/format';
import { blankReportInput, reportDtoToInput } from '@/lib/report-input';

type Mode = 'view' | 'edit' | 'create';

interface ReportFeatureProps {
  projectId: string;
  onOpenRiskRegister: () => void;
}

/**
 * Rapport exécutif du projet courant : un rapport par mois. Le brouillon du mois est recalculé à
 * chaque lecture ; une fois publié par le chef de projet, il est figé et rejoint l'historique.
 */
export function ReportFeature({ projectId, onOpenRiskRegister }: ReportFeatureProps) {
  const { canEdit, canManageProject } = useAuth();
  const reports = useExecutiveReports(projectId);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setMode('view');
    setSelected(null);
  }, [projectId]);

  const history = reports.data ?? [];
  const period = selected ?? history[0]?.period ?? null;
  const report = useExecutiveReport(projectId, period);
  const data = report.data;
  const draft = data !== null && data.publication === null;
  const thisMonth = todayIso().slice(0, 7);
  const refresh = () => {
    reports.reload();
    report.reload();
  };
  const saved = () => {
    setMode('view');
    refresh();
  };

  if (mode === 'edit' && data) {
    return (
      <ReportEditor
        mode="edit"
        projectId={projectId}
        initialInput={reportDtoToInput(data)}
        computedRag={data.overall.computedRag}
        onCancel={() => setMode('view')}
        onSaved={saved}
      />
    );
  }

  if (mode === 'create') {
    return (
      <ReportEditor
        mode="create"
        projectId={projectId}
        initialInput={blankReportInput()}
        onCancel={() => setMode('view')}
        onSaved={() => {
          setSelected(null);
          saved();
        }}
      />
    );
  }

  return (
    <>
      <PageActions>
        {history.length > 1 && (
          <select
            className="form-input report-period"
            aria-label="Mois du rapport"
            value={period ?? ''}
            onChange={(event) => setSelected(event.target.value)}
          >
            {history.map((item) => (
              <option key={item.period} value={item.period}>
                {formatMonth(item.period)} · {item.publishedAt ? 'publié' : 'brouillon'}
              </option>
            ))}
          </select>
        )}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          <>
            {draft && period && (
              <DeleteAction
                title={`Supprimer le rapport ${formatOfMonth(period)} ?`}
                message="Le brouillon et tout son contenu seront supprimés définitivement, pour tous les utilisateurs du projet."
                onDelete={async () => {
                  await deleteExecutiveReport(projectId, period);
                  setSelected(null);
                  refresh();
                }}
              />
            )}
            {draft && (
              <button type="button" className="btn btn--ghost" onClick={() => setMode('edit')}>
                Éditer
              </button>
            )}
            {draft && canManageProject && (
              <button type="button" className="btn btn--primary" onClick={() => setPublishing(true)}>
                Publier
              </button>
            )}
            {!reports.loading && !history.some((item) => item.period === thisMonth) && (
              <button type="button" className="btn btn--primary" onClick={() => setMode('create')}>
                + Rapport {formatOfMonth(thisMonth)}
              </button>
            )}
          </>
        )}
      </PageActions>

      {(reports.loading || report.loading) && <p className="app__status">Chargement du rapport…</p>}
      {reports.error && <p className="app__status app__status--error">{reports.error}</p>}
      {report.error && <p className="app__status app__status--error">{report.error}</p>}
      {!reports.loading && history.length === 0 && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Aucun rapport exécutif pour ce projet</h2>
            <p className="empty-state__text">
              Un rapport par mois : ses chiffres viennent du projet (échéancier, registres, avancement, dépenses), le chef
              de projet rédige le jugement et le publie.
            </p>
          </section>
        </div>
      )}
      {data && (
        <>
          <p className={`report-publication${data.publication ? ' report-publication--published' : ''}`} role="status">
            {data.publication
              ? `Publié le ${formatDateTime(data.publication.at)} par ${data.publication.by} : rapport figé, tel que publié.`
              : "Brouillon : les chiffres sont recalculés à chaque lecture, à la date du rapport, jusqu'à sa publication."}
          </p>
          <ExecutiveReport report={data} onOpenRiskRegister={onOpenRiskRegister} />
        </>
      )}

      {period && (
        <ConfirmDialog
          open={publishing}
          title={`Publier le rapport ${formatOfMonth(period)} ?`}
          message="Ses chiffres seront figés tels que calculés maintenant, et il rejoindra l'historique du projet : il ne pourra plus être modifié ni supprimé."
          confirmLabel="Publier"
          onClose={() => setPublishing(false)}
          onConfirm={async () => {
            await publishExecutiveReport(projectId, period);
            setPublishing(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
