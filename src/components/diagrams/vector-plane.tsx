import type { Figure } from "@/lib/schema";
import { FigureShell } from "./figure-shell";
import { figureId, scale, swatchColor } from "./geometry";

const WIDTH = 360;
const HEIGHT = 360;
const PAD = 30;

export function VectorPlane({
  figure,
}: {
  figure: Extract<Figure, { kind: "vector-plane" }>;
}) {
  const uid = figureId(figure.caption);
  const xRange: [number, number] = [PAD, WIDTH - PAD];
  const yRange: [number, number] = [HEIGHT - PAD, PAD];
  const px = (x: number) => scale(x, figure.xRange, xRange);
  const py = (y: number) => scale(y, figure.yRange, yRange);
  const xTicks: number[] = [];
  for (let v = Math.ceil(figure.xRange[0]); v <= Math.floor(figure.xRange[1]); v++)
    if (v !== 0) xTicks.push(v);
  const yTicks: number[] = [];
  for (let v = Math.ceil(figure.yRange[0]); v <= Math.floor(figure.yRange[1]); v++)
    if (v !== 0) yTicks.push(v);

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        {(["primary", "accent", "muted"] as const).map((c) => (
          <marker
            id={`vector-arrowhead-${uid}-${c}`}
            key={c}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill={swatchColor[c]} />
          </marker>
        ))}
      </defs>
      {xTicks.map((t) => (
        <line
          key={`x${t}`}
          x1={px(t)}
          y1={py(figure.yRange[0])}
          x2={px(t)}
          y2={py(figure.yRange[1])}
          stroke="var(--line)"
        />
      ))}
      {yTicks.map((t) => (
        <line
          key={`y${t}`}
          x1={px(figure.xRange[0])}
          y1={py(t)}
          x2={px(figure.xRange[1])}
          y2={py(t)}
          stroke="var(--line)"
        />
      ))}
      <line
        x1={px(figure.xRange[0])}
        y1={py(0)}
        x2={px(figure.xRange[1])}
        y2={py(0)}
        stroke="var(--muted)"
        strokeWidth={1}
      />
      <line
        x1={px(0)}
        y1={py(figure.yRange[0])}
        x2={px(0)}
        y2={py(figure.yRange[1])}
        stroke="var(--muted)"
        strokeWidth={1}
      />
      {figure.vectors.map((v, i) => (
        <g key={i}>
          <line
            x1={px(v.from.x)}
            y1={py(v.from.y)}
            x2={px(v.to.x)}
            y2={py(v.to.y)}
            stroke={swatchColor[v.color]}
            strokeWidth={2.5}
            markerEnd={`url(#vector-arrowhead-${uid}-${v.color})`}
          />
          <text
            x={px(v.to.x) + 8}
            y={py(v.to.y) - 6}
            fontSize={12}
            fontWeight={700}
            fill={swatchColor[v.color]}
          >
            {v.label}
          </text>
        </g>
      ))}
    </FigureShell>
  );
}
