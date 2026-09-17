import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function MathContent({ children }: { children: string }) {
  // Authored markdown only; raw HTML is never enabled. KaTeX includes MathML.
  const markdown = children
    .replaceAll("∀", "$\\forall$")
    .replaceAll("∃", "$\\exists$");
  return (
    <div className="math-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { strict: "error", throwOnError: true, trust: false }],
        ]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
