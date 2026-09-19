import type { Figure as FigureData } from "@/lib/schema";
import { NumberLine } from "./number-line";
import { FunctionPlot } from "./function-plot";
import { SetDiagram } from "./set-diagram";
import { VectorPlane } from "./vector-plane";
import { RelationGraph } from "./relation-graph";
import { MatrixGrid } from "./matrix-grid";

export function Figure({ figure }: { figure: FigureData }) {
  switch (figure.kind) {
    case "number-line":
      return <NumberLine figure={figure} />;
    case "function-plot":
      return <FunctionPlot figure={figure} />;
    case "set-diagram":
      return <SetDiagram figure={figure} />;
    case "vector-plane":
      return <VectorPlane figure={figure} />;
    case "relation-graph":
      return <RelationGraph figure={figure} />;
    case "matrix-grid":
      return <MatrixGrid figure={figure} />;
  }
}
