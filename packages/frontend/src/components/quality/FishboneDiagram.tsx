import type { CauseEffectInput } from '@shared/index';
import { truncate, wrapText } from '@/components/quality/svg-text';

const COL = 262;
const FIRST_BONE = 352;
const BONE_SPAN = 100;
const HEIGHT = 470;
const SPINE_Y = HEIGHT / 2;
const LABEL_Y = 22;
const BONE_TOP = 54;
const EFFECT_W = 190;
const EFFECT_H = 100;

/** Diagramme de causes et effets (arête de poisson) : catégories alternées au-dessus et au-dessous de l'arête. */
export function FishboneDiagram({ analysis }: { analysis: CauseEffectInput }) {
  const columns = Math.max(1, Math.ceil(analysis.categories.length / 2));
  const lastBone = FIRST_BONE + (columns - 1) * COL;
  const effectX = lastBone + 50;
  const width = effectX + EFFECT_W + 20;
  const effectLines = wrapText(analysis.effect, 26, 4);

  return (
    <div className="network-scroll">
      <svg
        className="fishbone"
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Causes et effets : ${analysis.effect}`}
      >
        <defs>
          <marker id="fishbone-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M0 0 10 5 0 10z" className="fishbone__arrow" />
          </marker>
        </defs>
        <line x1="20" y1={SPINE_Y} x2={effectX - 4} y2={SPINE_Y} className="fishbone__spine" markerEnd="url(#fishbone-arrow)" />
        <rect x={effectX} y={SPINE_Y - EFFECT_H / 2} width={EFFECT_W} height={EFFECT_H} rx="6" className="fishbone__effect" />
        {effectLines.map((line, index) => (
          <text
            key={line}
            x={effectX + EFFECT_W / 2}
            y={SPINE_Y - ((effectLines.length - 1) * 16) / 2 + index * 16 + 4}
            textAnchor="middle"
            className="fishbone__effect-text"
          >
            {line}
          </text>
        ))}

        {analysis.categories.map((category, index) => {
          const top = index % 2 === 0;
          const bone = FIRST_BONE + Math.floor(index / 2) * COL;
          const startX = bone - BONE_SPAN;
          const startY = top ? BONE_TOP : HEIGHT - BONE_TOP;
          const labelY = top ? LABEL_Y : HEIGHT - LABEL_Y - 28;
          const point = (t: number) => ({ x: startX + BONE_SPAN * t, y: startY + (SPINE_Y - startY) * t });
          return (
            <g key={category.name} className={`fishbone__category fishbone__category--${index % 6}`}>
              <rect x={startX - 66} y={labelY} width="132" height="28" rx="4" className="fishbone__label-box" />
              <text x={startX} y={labelY + 18} textAnchor="middle" className="fishbone__label">
                {truncate(category.name, 20)}
              </text>
              <line x1={startX} y1={startY} x2={bone} y2={SPINE_Y} className="fishbone__bone" />
              {category.causes.map((cause, causeIndex) => {
                const { x, y } = point((causeIndex + 1) / (category.causes.length + 1));
                return (
                  <g key={cause}>
                    <title>{cause}</title>
                    <line x1={x - 22} y1={y} x2={x} y2={y} className="fishbone__tick" />
                    <text x={x - 26} y={y + 4} textAnchor="end" className="fishbone__cause">
                      {truncate(cause, 40)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
