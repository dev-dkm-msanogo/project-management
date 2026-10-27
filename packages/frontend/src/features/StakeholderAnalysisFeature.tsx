import type { StakeholderDto } from '@shared/index';
import { StakeholderAnalysisTable } from '@/components/stakeholders/StakeholderAnalysisTable';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { analysisLevel } from '@/lib/stakeholder-tools-format';
import type { AppView } from '@/navigation/pmp';

interface StakeholderAnalysisFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Du plus influent au moins influent, puis du plus au moins intéressé. */
const byInfluence = (a: StakeholderDto, b: StakeholderDto) =>
  b.power - a.power || b.interest - a.interest || a.code.localeCompare(b.code);

/**
 * Page « Analyse des parties prenantes » : lecture seule, tirée du registre (pouvoir, intérêt et
 * engagement actuel), qui reste le seul endroit où ces valeurs se saisissent.
 */
export function StakeholderAnalysisFeature({ projectId, onNavigate }: StakeholderAnalysisFeatureProps) {
  const { data, loading, error } = useStakeholderRegister(projectId);
  const stakeholders = [...(data?.stakeholders ?? [])].sort(byInfluence);
  const count = (keep: (stakeholder: StakeholderDto) => boolean) => stakeholders.filter(keep).length;

  return (
    <>
      {loading && <p className="app__status">Chargement du registre des parties prenantes…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && stakeholders.length === 0 && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Aucune partie prenante à analyser</h2>
            <p className="empty-state__text">
              L'analyse se construit à partir du registre : intérêt, pouvoir et engagement actuel de chaque partie
              prenante.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('stakeholders')}>
              Identifier les parties prenantes →
            </button>
          </section>
        </div>
      )}
      {stakeholders.length > 0 && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Influence élevée', value: count((s) => analysisLevel(s.power) === 'HIGH') },
              {
                label: 'Favorables',
                value: count((s) => s.currentEngagement === 'SUPPORTIVE' || s.currentEngagement === 'LEADING'),
                tone: 'success',
              },
              { label: 'Neutres', value: count((s) => s.currentEngagement === 'NEUTRAL') },
              {
                label: 'Réfractaires ou non informées',
                value: count((s) => s.currentEngagement === 'RESISTANT' || s.currentEngagement === 'UNAWARE'),
                tone: 'warning',
              },
            ]}
          />
          <p className="doc-status">
            Intérêt et influence viennent des échelles du registre (faible de 1 à 2, moyen à 3, élevé de 4 à 5),
            l'attitude de l'engagement actuel.{' '}
            <button type="button" className="ref-link" onClick={() => onNavigate('stakeholders')}>
              Modifier dans le registre →
            </button>
          </p>
          <section className="doc-panel">
            <StakeholderAnalysisTable stakeholders={stakeholders} />
          </section>
        </article>
      )}
    </>
  );
}
