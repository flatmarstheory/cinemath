import type { Figure, FunctionPresetId } from "@/lib/schema";
import { FigureShell } from "./figure-shell";
import { scale, swatchColor } from "./geometry";

// Closed lookup of plain JS functions, matched to schema.ts's
// functionPresetIds — never an expression evaluator (ROADMAP.md: no CAS).
const presets: Record<FunctionPresetId, (x: number) => number> = {
  identity: (x) => x,
  square: (x) => x * x,
  cube: (x) => x * x * x,
  reciprocal: (x) => (x === 0 ? NaN : 1 / x),
  abs: (x) => Math.abs(x),
  sqrt: (x) => (x < 0 ? NaN : Math.sqrt(x)),
  sin: (x) => Math.sin(x),
  floor: (x) => Math.floor(x),
  exp: (x) => Math.exp(x),
  negation: (x) => -x,
  "constant-zero": () => 0,
  triangular: (x) => (x * (x + 1)) / 2,
  "power-of-two": (x) => Math.pow(2, x),
};

const WIDTH = 400;
const HEIGHT = 320;
const PAD = 34;

function samplesFor(
  preset: FunctionPresetId,
  domain: readonly [number, number],
): { x: number; y: number }[] {
  const fn = presets[preset];
  const steps = 160;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = domain[0] + ((domain[1] - domain[0]) * i) / steps;
    const y = fn(x);
    if (Number.isFinite(y)) points.push({ x, y });
  }
  return points;
}

export function FunctionPlot({
  figure,
}: {
  figure: Extract<Figure, { kind: "function-plot" }>;
}) {
  const allY = figure.curves.flatMap((c) =>
    samplesFor(c.preset, figure.domain).map((p) => p.y),
  );
  const fallbackRange: [number, number] = [
    Math.min(0, ...allY, -1),
    Math.max(0, ...allY, 1),
  ];
  const yDomain = figure.range ?? fallbackRange;
  const xRange: [number, number] = [PAD, WIDTH - PAD];
  const yRange: [number, number] = [HEIGHT - PAD, PAD];
  const px = (x: number) => scale(x, figure.domain, xRange);
  const py = (y: number) => scale(y, yDomain, yRange);

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <rect
        x={PAD}
        y={PAD}
        width={WIDTH - PAD * 2}
        height={HEIGHT - PAD * 2}
        fill="none"
        stroke="var(--line)"
      />
      {yDomain[0] < 0 && yDomain[1] > 0 && (
        <line
          x1={PAD}
          y1={py(0)}
          x2={WIDTH - PAD}
          y2={py(0)}
          stroke="var(--muted)"
          strokeWidth={1}
        />
      )}
      {figure.domain[0] < 0 && figure.domain[1] > 0 && (
        <line
          x1={px(0)}
          y1={PAD}
          x2={px(0)}
          y2={HEIGHT - PAD}
          stroke="var(--muted)"
          strokeWidth={1}
        />
      )}
      {figure.curves.map((curve, i) => {
        const points = samplesFor(curve.preset, figure.domain);
        // Break the path at asymptotes (e.g. 1/x) instead of drawing a
        // spurious line straight across the discontinuity.
        const yDomainSpan = Math.abs(yDomain[1] - yDomain[0]) || 1;
        let path = "";
        points.forEach((p, j) => {
          const jump =
            j > 0 && Math.abs(p.y - points[j - 1].y) > yDomainSpan * 1.5;
          path += `${j === 0 || jump ? "M" : "L"}${px(p.x)},${py(p.y)} `;
        });
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={swatchColor[curve.color]}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}
      {figure.markedPoints.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.x)} cy={py(p.y)} r={4.5} fill="#875b19" />
          <text
            x={px(p.x) + 8}
            y={py(p.y) - 8}
            fontSize={11}
            fontWeight={700}
            fill="#875b19"
          >
            {p.label}
          </text>
        </g>
      ))}
      {figure.curves.length > 1 &&
        figure.curves.map((curve, i) => (
          <g key={curve.label} transform={`translate(${PAD + 4},${PAD + 14 * i + 4})`}>
            <line
              x1={0}
              y1={0}
              x2={16}
              y2={0}
              stroke={swatchColor[curve.color]}
              strokeWidth={3}
            />
            <text x={22} y={3} fontSize={10} fill="var(--muted)">
              {curve.label}
            </text>
          </g>
        ))}
    </FigureShell>
  );
}
