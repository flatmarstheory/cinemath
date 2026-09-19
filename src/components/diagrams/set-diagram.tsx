import type { Figure } from "@/lib/schema";
import { FigureShell } from "./figure-shell";
import { figureId } from "./geometry";

const WIDTH = 400;
const HEIGHT = 300;
const RADIUS = 100;

// Fixed, hand-tuned layouts for the only two set counts this figure kind
// supports (schema.ts caps `sets` at 2–3) — a general N-circle Venn layout
// isn't worth the complexity for a teaching diagram.
const CIRCLES_2 = [
  { cx: 155, cy: 150 },
  { cx: 245, cy: 150 },
];
const CIRCLES_3 = [
  { cx: 160, cy: 125 },
  { cx: 240, cy: 125 },
  { cx: 200, cy: 195 },
];
const ANCHORS_2: Record<string, { x: number; y: number }> = {
  "0": { x: 110, y: 150 },
  "1": { x: 290, y: 150 },
  "0,1": { x: 200, y: 150 },
  none: { x: 55, y: 265 },
};
const ANCHORS_3: Record<string, { x: number; y: number }> = {
  "0": { x: 130, y: 95 },
  "1": { x: 270, y: 95 },
  "2": { x: 200, y: 245 },
  "0,1": { x: 200, y: 95 },
  "0,2": { x: 150, y: 170 },
  "1,2": { x: 250, y: 170 },
  "0,1,2": { x: 200, y: 150 },
  none: { x: 45, y: 270 },
};

export function SetDiagram({
  figure,
}: {
  figure: Extract<Figure, { kind: "set-diagram" }>;
}) {
  const uid = figureId(figure.caption);
  const n = figure.sets.length;
  const circles = n === 2 ? CIRCLES_2 : CIRCLES_3;
  const anchors = n === 2 ? ANCHORS_2 : ANCHORS_3;
  const idIndex = new Map(figure.sets.map((s, i) => [s.id, i]));
  const labelPos = [
    { x: circles[0].cx - RADIUS + 8, y: circles[0].cy - RADIUS + 18 },
    { x: circles[1].cx + RADIUS - 8, y: circles[1].cy - RADIUS + 18 },
    n === 3 ? { x: circles[2].cx, y: circles[2].cy + RADIUS + 6 } : undefined,
  ];

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        {circles.map((c, i) => (
          <clipPath id={`set-clip-${uid}-${i}`} key={i}>
            <circle cx={c.cx} cy={c.cy} r={RADIUS} />
          </clipPath>
        ))}
      </defs>
      <rect
        x={1}
        y={1}
        width={WIDTH - 2}
        height={HEIGHT - 2}
        fill="none"
        stroke="var(--line)"
      />
      {figure.shadedRegions.map((region, i) => {
        const indices = region
          .map((id) => idIndex.get(id))
          .filter((v): v is number => v !== undefined);
        if (indices.length === 0) return null;
        let node = (
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#875b1955" />
        );
        for (const idx of indices)
          node = <g clipPath={`url(#set-clip-${uid}-${idx})`}>{node}</g>;
        return <g key={i}>{node}</g>;
      })}
      {circles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={RADIUS}
          fill="none"
          stroke="var(--green)"
          strokeWidth={2}
        />
      ))}
      {figure.sets.map((s, i) => {
        const pos = labelPos[i];
        if (!pos) return null;
        return (
          <text
            key={s.id}
            x={pos.x}
            y={pos.y}
            fontSize={13}
            fontWeight={700}
            fill="var(--green)"
            textAnchor="middle"
          >
            {s.label}
          </text>
        );
      })}
      {figure.elements.map((el, i) => {
        const key =
          el.memberOf.length === 0
            ? "none"
            : el.memberOf
                .map((id) => idIndex.get(id))
                .filter((v): v is number => v !== undefined)
                .sort((a, b) => a - b)
                .join(",");
        const base = anchors[key] ?? anchors.none;
        // Small deterministic jitter so repeated elements in one region don't stack exactly.
        const jitter = ((i * 37) % 20) - 10;
        return (
          <g key={i}>
            <circle
              cx={base.x + jitter}
              cy={base.y + ((i * 17) % 14) - 7}
              r={3.5}
              fill="var(--ink)"
            />
            <text
              x={base.x + jitter + 7}
              y={base.y + ((i * 17) % 14) - 4}
              fontSize={10.5}
              fill="var(--ink)"
            >
              {el.label}
            </text>
          </g>
        );
      })}
    </FigureShell>
  );
}
