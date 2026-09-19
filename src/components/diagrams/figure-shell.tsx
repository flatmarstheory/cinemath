import type { ReactNode } from "react";

// Shared chrome for every diagram: an accessible <figure> with a titled SVG
// canvas and a visible caption. Individual diagrams only need to supply the
// SVG contents and a viewBox.
export function FigureShell({
  caption,
  viewBox,
  children,
}: {
  caption: string;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <figure className="figure">
      <svg
        viewBox={viewBox}
        className="figure-canvas"
        role="img"
        aria-label={caption}
      >
        {children}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
