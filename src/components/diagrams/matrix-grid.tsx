import type { Figure } from "@/lib/schema";
import { FigureShell } from "./figure-shell";

const CELL = 56;
const PAD = 30;
const BRACKET = 12;

export function MatrixGrid({
  figure,
}: {
  figure: Extract<Figure, { kind: "matrix-grid" }>;
}) {
  const rows = figure.rows.length;
  const cols = figure.rows[0]?.length ?? 0;
  const width = cols * CELL + PAD * 2 + BRACKET * 2;
  const height = rows * CELL + PAD * 2;
  const highlighted = new Set(figure.highlight.map(([r, c]) => `${r},${c}`));
  const left = PAD + BRACKET;
  const top = PAD;

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${width} ${height}`}>
      {figure.rows.map((row, r) =>
        row.map((value, c) => {
          const x = left + c * CELL;
          const y = top + r * CELL;
          const on = highlighted.has(`${r},${c}`);
          return (
            <g key={`${r}-${c}`}>
              {on && (
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  fill="#dceca9"
                  stroke="var(--green)"
                  strokeWidth={1.5}
                />
              )}
              <text
                x={x + CELL / 2}
                y={y + CELL / 2 + 6}
                textAnchor="middle"
                fontSize={17}
                fontFamily="Georgia, serif"
                fill="var(--ink)"
              >
                {value}
              </text>
            </g>
          );
        }),
      )}
      {/* Left and right matrix brackets */}
      <path
        d={`M${left - 4},${top - 4} L${left - BRACKET},${top - 4} L${left - BRACKET},${top + rows * CELL + 4} L${left - 4},${top + rows * CELL + 4}`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2}
      />
      <path
        d={`M${left + cols * CELL + 4},${top - 4} L${left + cols * CELL + BRACKET},${top - 4} L${left + cols * CELL + BRACKET},${top + rows * CELL + 4} L${left + cols * CELL + 4},${top + rows * CELL + 4}`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2}
      />
    </FigureShell>
  );
}
