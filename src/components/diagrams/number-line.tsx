import type { Figure } from "@/lib/schema";
import { FigureShell } from "./figure-shell";
import { scale } from "./geometry";

const WIDTH = 640;
const HEIGHT = 140;
const PAD = 36;
const AXIS_Y = 74;

export function NumberLine({
  figure,
}: {
  figure: Extract<Figure, { kind: "number-line" }>;
}) {
  const domain: [number, number] = [figure.min, figure.max];
  const range: [number, number] = [PAD, WIDTH - PAD];
  const x = (v: number) => scale(v, domain, range);
  const ticks: number[] = [];
  for (let v = Math.ceil(figure.min); v <= Math.floor(figure.max); v++)
    ticks.push(v);

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <line
        x1={range[0]}
        y1={AXIS_Y}
        x2={range[1]}
        y2={AXIS_Y}
        stroke="var(--ink)"
        strokeWidth={1.5}
      />
      <polygon
        points={`${range[1]},${AXIS_Y} ${range[1] - 8},${AXIS_Y - 4} ${range[1] - 8},${AXIS_Y + 4}`}
        fill="var(--ink)"
      />
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={x(t)}
            y1={AXIS_Y - 5}
            x2={x(t)}
            y2={AXIS_Y + 5}
            stroke="var(--muted)"
            strokeWidth={1}
          />
          <text
            x={x(t)}
            y={AXIS_Y + 22}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {t}
          </text>
        </g>
      ))}
      {figure.intervals.map((interval, i) => (
        <g key={i}>
          <line
            x1={x(interval.from)}
            y1={AXIS_Y - 16}
            x2={x(interval.to)}
            y2={AXIS_Y - 16}
            stroke="var(--green)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle
            cx={x(interval.from)}
            cy={AXIS_Y - 16}
            r={4.5}
            fill={interval.closedFrom ? "var(--green)" : "var(--white)"}
            stroke="var(--green)"
            strokeWidth={2}
          />
          <circle
            cx={x(interval.to)}
            cy={AXIS_Y - 16}
            r={4.5}
            fill={interval.closedTo ? "var(--green)" : "var(--white)"}
            stroke="var(--green)"
            strokeWidth={2}
          />
          {interval.label && (
            <text
              x={(x(interval.from) + x(interval.to)) / 2}
              y={AXIS_Y - 24}
              textAnchor="middle"
              fontSize={11}
              fill="var(--green)"
            >
              {interval.label}
            </text>
          )}
        </g>
      ))}
      {figure.points.map((p, i) => (
        <g key={i}>
          <circle
            cx={x(p.value)}
            cy={AXIS_Y}
            r={6}
            fill={p.style === "include" ? "#875b19" : "var(--white)"}
            stroke="#875b19"
            strokeWidth={2}
          />
          <text
            x={x(p.value)}
            y={AXIS_Y - 14}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#875b19"
          >
            {p.label}
          </text>
        </g>
      ))}
    </FigureShell>
  );
}
