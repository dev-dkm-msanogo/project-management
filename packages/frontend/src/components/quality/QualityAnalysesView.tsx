import { useState } from 'react';
import type { QualityAnalysesDto } from '@shared/index';
import { FishboneDiagram } from '@/components/quality/FishboneDiagram';
import { FlowchartDiagram } from '@/components/quality/FlowchartDiagram';
import { Tabs } from '@/components/ui/Tabs';
import type { AnalysisTab } from '@/lib/quality-tools-format';

interface QualityAnalysesViewProps {
  analyses: QualityAnalysesDto;
  tab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}

/** Choix d'un diagramme quand l'outil en compte plusieurs. */
function Picker({ items, active, onPick }: { items: { code: string; label: string }[]; active: number; onPick: (index: number) => void }) {
  if (items.length < 2) return null;
  return (
    <div className="analysis-picker" role="group" aria-label="Diagramme affiché">
      {items.map((item, index) => (
        <button
          key={item.code}
          type="button"
          className={`analysis-picker__item${index === active ? ' analysis-picker__item--active' : ''}`}
          aria-pressed={index === active}
          onClick={() => onPick(index)}
        >
          <span className="register-table__code">{item.code}</span> {item.label}
        </button>
      ))}
    </div>
  );
}

/** Outils d'analyse qualité : diagramme d'affinités, analyses des causes, logigrammes. */
export function QualityAnalysesView({ analyses, tab, onTabChange }: QualityAnalysesViewProps) {
  const [cause, setCause] = useState(0);
  const [flow, setFlow] = useState(0);
  const { affinity, causeEffects, flowcharts } = analyses;
  const analysis = causeEffects[Math.min(cause, causeEffects.length - 1)];
  const flowchart = flowcharts[Math.min(flow, flowcharts.length - 1)];

  return (
    <Tabs
      label="Outils d'analyse"
      active={tab}
      onChange={onTabChange}
      tabs={[
        { id: 'affinity', label: "Diagramme d'affinités", count: affinity.groups.length },
        { id: 'causes', label: 'Causes et effets', count: causeEffects.length },
        { id: 'flowcharts', label: 'Logigrammes', count: flowcharts.length },
      ]}
    >
      <section className="doc-panel">
        {tab === 'affinity' &&
          (affinity.groups.length === 0 ? (
            <p className="plan__empty">Aucun thème regroupé.</p>
          ) : (
            <>
              {affinity.question && (
                <p className="analysis-question">
                  <strong>Question : </strong>
                  {affinity.question}
                </p>
              )}
              <div className="affinity-groups">
                {affinity.groups.map((group, index) => (
                  <section key={group.theme} className={`affinity-group affinity-group--${index % 6}`}>
                    <h3 className="affinity-group__theme">{group.theme}</h3>
                    <ul className="affinity-group__ideas">
                      {group.ideas.map((idea) => (
                        <li key={idea}>{idea}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          ))}

        {tab === 'causes' &&
          (!analysis ? (
            <p className="plan__empty">Aucune analyse des causes.</p>
          ) : (
            <>
              <Picker items={causeEffects.map((item) => ({ code: item.code, label: item.effect }))} active={cause} onPick={setCause} />
              <p className="analysis-question">
                <strong>Effet analysé : </strong>
                {analysis.effect}
              </p>
              <FishboneDiagram analysis={analysis} />
            </>
          ))}

        {tab === 'flowcharts' &&
          (!flowchart ? (
            <p className="plan__empty">Aucun logigramme.</p>
          ) : (
            <>
              <Picker items={flowcharts.map((item) => ({ code: item.code, label: item.name }))} active={flow} onPick={setFlow} />
              <p className="analysis-question">
                <strong>Processus : </strong>
                {flowchart.name}
                {flowchart.description && ` — ${flowchart.description}`}
              </p>
              <FlowchartDiagram flowchart={flowchart} />
            </>
          ))}
      </section>
    </Tabs>
  );
}
