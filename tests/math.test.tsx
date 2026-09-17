import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { lessons } from "../src/lib/content";
import { MathContent } from "../src/components/math-content";

it("renders every authored mathematical string without KaTeX errors and with MathML", () => {
  let mathCount = 0;
  function visit(value: unknown) {
    if (typeof value === "string" && /\$/.test(value)) {
      const html = renderToStaticMarkup(<MathContent>{value}</MathContent>);
      expect(html).not.toContain("katex-error");
      expect(html).toContain("<math");
      mathCount++;
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  }
  visit(lessons);
  expect(mathCount).toBeGreaterThan(30);
});
