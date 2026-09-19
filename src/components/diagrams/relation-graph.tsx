import type { Figure } from "@/lib/schema";
import { FigureShell } from "./figure-shell";
import { figureId } from "./geometry";

const SIZE = 340;
const CENTER = SIZE / 2;
const NODE_RADIUS = 20;

export function RelationGraph({
  figure,
}: {
  figure: Extract<Figure, { kind: "relation-graph" }>;
}) {
  const uid = figureId(figure.caption);
  const n = figure.nodes.length;
  const orbitRadius = n <= 1 ? 0 : SIZE / 2 - NODE_RADIUS - 24;
  const positions = new Map(
    figure.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return [
        node.id,
        {
          x: CENTER + orbitRadius * Math.cos(angle),
          y: CENTER + orbitRadius * Math.sin(angle),
        },
      ];
    }),
  );

  return (
    <FigureShell caption={figure.caption} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <marker
          id={`relation-arrowhead-${uid}`}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--green)" />
        </marker>
      </defs>
      {figure.edges.map((edge, i) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        if (edge.from === edge.to) {
          const loopX = from.x;
          const loopY = from.y - NODE_RADIUS;
          return (
            <path
              key={i}
              d={`M${loopX - 10},${loopY} C${loopX - 24},${loopY - 30} ${loopX + 24},${loopY - 30} ${loopX + 10},${loopY}`}
              fill="none"
              stroke="var(--green)"
              strokeWidth={1.75}
              markerEnd={`url(#relation-arrowhead-${uid})`}
            />
          );
        }
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const x1 = from.x + ux * NODE_RADIUS;
        const y1 = from.y + uy * NODE_RADIUS;
        const x2 = to.x - ux * (NODE_RADIUS + 6);
        const y2 = to.y - uy * (NODE_RADIUS + 6);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--green)"
            strokeWidth={1.75}
            markerEnd={
              edge.directed ? `url(#relation-arrowhead-${uid})` : undefined
            }
          />
        );
      })}
      {figure.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={NODE_RADIUS}
              fill="var(--white)"
              stroke="var(--ink)"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--ink)"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </FigureShell>
  );
}
