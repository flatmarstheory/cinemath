import type { Figure } from "./schema";

// Small, presentation-only lookup for the homepage hero — not authored
// content, so it lives in code rather than content/catalog.json. New
// courses fall back to a generic tagline and figure until given their own.
const taglines: Record<string, string> = {
  "proofs-for-modern-mathematics": "THINK CLEARLY. PROVE IT.",
  "linear-algebra-beyond-computation": "SEE THE STRUCTURE. TRUST THE PROOF.",
};

export function heroTagline(courseSlug: string): string {
  return taglines[courseSlug] ?? "LEARN IT BY DOING IT.";
}

const proofsHero: Figure = {
  kind: "number-line",
  caption: "∀x ∈ ℝ, x² ≥ 0 — true for every point on the line.",
  min: -4,
  max: 4,
  points: [
    { value: -2, label: "−2", style: "include" },
    { value: 0, label: "0", style: "include" },
    { value: 3, label: "3", style: "include" },
  ],
  intervals: [{ from: -4, to: 4, closedFrom: true, closedTo: true }],
};

const linearAlgebraHero: Figure = {
  kind: "vector-plane",
  caption: "Two independent vectors span the entire plane.",
  xRange: [-3, 3],
  yRange: [-3, 3],
  vectors: [
    { from: { x: 0, y: 0 }, to: { x: 2, y: 1 }, label: "v", color: "primary" },
    { from: { x: 0, y: 0 }, to: { x: -1, y: 2 }, label: "w", color: "accent" },
  ],
};

const defaultHero: Figure = {
  kind: "function-plot",
  caption: "Every idea here is something you work out, not just read.",
  domain: [-2, 2],
  curves: [{ preset: "square", label: "x²", color: "primary" }],
  markedPoints: [{ x: 1, y: 1, label: "(1, 1)" }],
};

const heroFigures: Record<string, Figure> = {
  "proofs-for-modern-mathematics": proofsHero,
  "linear-algebra-beyond-computation": linearAlgebraHero,
};

export function heroFigureFor(courseSlug: string): Figure {
  return heroFigures[courseSlug] ?? defaultHero;
}

// Small, square-ish figures for the course-switcher cards — distinct from
// the wider hero figures above so they stay legible at icon size.
const proofsIcon: Figure = {
  kind: "set-diagram",
  caption: "Proofs for Modern Mathematics",
  sets: [
    { id: "A", label: "A" },
    { id: "B", label: "B" },
  ],
  shadedRegions: [["A", "B"]],
  elements: [],
};

const linearAlgebraIcon: Figure = {
  kind: "vector-plane",
  caption: "Linear Algebra Beyond Computation",
  xRange: [-2, 2],
  yRange: [-2, 2],
  vectors: [
    { from: { x: 0, y: 0 }, to: { x: 1.5, y: 1 }, label: "v", color: "primary" },
    { from: { x: 0, y: 0 }, to: { x: -1, y: 1.5 }, label: "w", color: "accent" },
  ],
};

const defaultIcon: Figure = {
  kind: "function-plot",
  caption: "This course",
  domain: [-1.5, 1.5],
  curves: [{ preset: "square", label: "x²", color: "primary" }],
  markedPoints: [],
};

const courseIcons: Record<string, Figure> = {
  "proofs-for-modern-mathematics": proofsIcon,
  "linear-algebra-beyond-computation": linearAlgebraIcon,
};

export function courseIconFor(courseSlug: string): Figure {
  return courseIcons[courseSlug] ?? defaultIcon;
}
