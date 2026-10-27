import type { FlowchartInput, FlowStepInput } from '@shared/index';
import { truncate, wrapText } from '@/components/quality/svg-text';

const CX = 250;
const NODE_W = 260;
const DIAMOND_W = 230;
const GAP = 34;
const LANE = 24;

const heightOf = (step: FlowStepInput) => (step.kind === 'DECISION' ? 84 : step.kind === 'ACTION' ? 56 : 46);

interface Placed {
  step: FlowStepInput;
  top: number;
  height: number;
}

/** Logigramme : étapes de haut en bas, « Oui » vers l'étape suivante, « Non » en boucle sur la droite. */
export function FlowchartDiagram({ flowchart }: { flowchart: FlowchartInput }) {
  let y = 14;
  const placed: Placed[] = flowchart.steps.map((step) => {
    const node = { step, top: y, height: heightOf(step) };
    y += node.height + GAP;
    return node;
  });
  const height = y - GAP + 14;
  const byCode = new Map(placed.map((node) => [node.step.code, node]));
  const loops = placed.filter((node) => node.step.kind === 'DECISION' && node.step.noTarget && byCode.has(node.step.noTarget));
  const laneStart = CX + NODE_W / 2 + 40;
  const width = laneStart + loops.length * LANE + 220;

  return (
    <div className="network-scroll">
      <svg className="flowchart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Logigramme : ${flowchart.name}`}>
        <defs>
          <marker id="flowchart-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 10 5 0 10z" className="flowchart__arrow" />
          </marker>
        </defs>

        {placed.slice(0, -1).map((node, index) => {
          const next = placed[index + 1]!;
          const from = node.top + node.height;
          return (
            <g key={`next-${node.step.code}`}>
              <line x1={CX} y1={from} x2={CX} y2={next.top - 2} className="flowchart__link" markerEnd="url(#flowchart-arrow)" />
              {node.step.kind === 'DECISION' && (
                <text x={CX + 8} y={from + 16} className="flowchart__yes">
                  Oui
                </text>
              )}
            </g>
          );
        })}

        {placed.map(({ step, top, height: h }) => {
          const cy = top + h / 2;
          const lines = wrapText(step.label, step.kind === 'DECISION' ? 24 : 34, 2);
          return (
            <g key={step.code} className={`flowchart__node flowchart__node--${step.kind.toLowerCase()}`}>
              <title>{`${step.code} · ${step.label}`}</title>
              {step.kind === 'DECISION' ? (
                <polygon points={`${CX},${top} ${CX + DIAMOND_W / 2},${cy} ${CX},${top + h} ${CX - DIAMOND_W / 2},${cy}`} />
              ) : step.kind === 'ACTION' ? (
                <rect x={CX - NODE_W / 2} y={top} width={NODE_W} height={h} rx="4" />
              ) : (
                <ellipse cx={CX} cy={cy} rx={NODE_W / 2 - 20} ry={h / 2} />
              )}
              {lines.map((line, index) => (
                <text key={line} x={CX} y={cy - ((lines.length - 1) * 15) / 2 + index * 15 + 4} textAnchor="middle" className="flowchart__text">
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {placed
          .filter((node) => node.step.kind === 'DECISION')
          .map((node) => {
            const cy = node.top + node.height / 2;
            const right = CX + DIAMOND_W / 2;
            const label = node.step.noLabel ? `Non · ${node.step.noLabel}` : 'Non';
            const target = node.step.noTarget ? byCode.get(node.step.noTarget) : undefined;
            if (!target) {
              return (
                <g key={`no-${node.step.code}`}>
                  <line x1={right} y1={cy} x2={laneStart} y2={cy} className="flowchart__link flowchart__link--no" markerEnd="url(#flowchart-arrow)" />
                  {wrapText(label, 30, 2).map((line, index, lines) => (
                    <text key={line} x={laneStart + 6} y={cy + 4 + (index - (lines.length - 1) / 2) * 14} className="flowchart__no">
                      {line}
                    </text>
                  ))}
                </g>
              );
            }
            const lane = laneStart + loops.indexOf(node) * LANE;
            const targetY = target.top + target.height / 2;
            const targetEdge = target.step.kind === 'DECISION' ? CX + DIAMOND_W / 2 : CX + NODE_W / 2;
            return (
              <g key={`no-${node.step.code}`}>
                <path
                  d={`M${right} ${cy} H${lane} V${targetY} H${targetEdge + 2}`}
                  className="flowchart__link flowchart__link--no"
                  markerEnd="url(#flowchart-arrow)"
                />
                <text x={lane + 8} y={(cy + targetY) / 2 + 4} className="flowchart__no">
                  {truncate(label, 32)}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}
