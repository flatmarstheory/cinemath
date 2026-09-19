// Linear map from a data-space [domainMin, domainMax] to a pixel-space
// [rangeMin, rangeMax], shared by every diagram in this folder.
export function scale(
  value: number,
  domain: readonly [number, number],
  range: readonly [number, number],
): number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d1 === d0) return (r0 + r1) / 2;
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

export const swatchColor: Record<"primary" | "accent" | "muted", string> = {
  primary: "var(--green)",
  accent: "#875b19",
  muted: "var(--muted)",
};

// A short, deterministic id derived from a figure's own caption, used to
// namespace SVG <defs> (clipPath/marker) ids. Two figures can be mounted on
// the page at once (e.g. a lesson's "Revisit the idea" panel next to a
// problem that also has a figure), so ids must not collide — but this can't
// use React's useId(), since these diagrams also render from a Server
// Component (the homepage hero), where useId is unavailable.
export function figureId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `fig-${(hash >>> 0).toString(36)}`;
}
