import type { Answer, CounterexampleCheckerId, Problem } from "./schema";

// Deliberately bounded set of integer predicates, not arbitrary code execution.
const counterexampleCheckers: Record<
  CounterexampleCheckerId,
  (n: bigint) => boolean
> = {
  "integer-square-not-greater": (n) => n * n <= n,
  "integer-even-with-even-square": (n) => {
    const mod = ((n % 2n) + 2n) % 2n;
    return mod === 0n && (n * n) % 2n === 0n;
  },
};

// Deliberately bounded structured normal form, not a general symbolic algebra engine.
export function quantifierSpec(expression: string) {
  const match = expression.match(
    /^\\(forall|exists)\s+([a-z])\s*\\in\s*\\mathbb\{R\},\s*\\(forall|exists)\s+([a-z])\s*\\in\s*\\mathbb\{R\},\s*([a-z])\s*\+\s*([a-z])\s*(=|\\neq)\s*0$/,
  );
  if (
    !match ||
    match[2] !== match[5] ||
    match[4] !== match[6] ||
    match[2] === match[4]
  )
    throw new Error("Unsupported quantifier normal form in authored content");
  return {
    outer: match[1],
    first: match[2],
    inner: match[3],
    second: match[4],
    relation: match[7] === "=" ? "=" : "neq",
  };
}
export function initialAnswer(problem: Problem): Answer {
  switch (problem.type) {
    case "multiple_choice":
      return { kind: "choice", selected: [] };
    case "proof_ordering":
      return {
        kind: "order",
        steps: problem.answerSpec.steps.map((s) => s.id).reverse(),
      };
    case "symbolic":
      return { kind: "quantifiers", outer: "", inner: "", relation: "" };
    case "proof_fill_blank":
      return {
        kind: "blanks",
        values: Object.fromEntries(
          problem.answerSpec.blanks.map((b) => [b.id, ""]),
        ),
      };
    case "proof_free_response":
      return { kind: "proof", text: "" };
    default:
      return { kind: "number", value: "" };
  }
}
export function proofWordCount(text: string) {
  return text.trim().length ? text.trim().split(/\s+/).length : 0;
}
export type Grade =
  | { valid: false; message: string }
  | { valid: true; correct: boolean; message: string };
export function grade(problem: Problem, answer: Answer): Grade {
  let correct = false;
  switch (problem.type) {
    case "multiple_choice": {
      if (
        answer.kind !== "choice" ||
        !answer.selected.length ||
        new Set(answer.selected).size !== answer.selected.length ||
        !answer.selected.every((id) =>
          problem.answerSpec.options.some((o) => o.id === id),
        ) ||
        (problem.answerSpec.correctOptionIds.length === 1 &&
          answer.selected.length !== 1)
      )
        return { valid: false, message: "Choose an answer before checking." };
      correct =
        answer.selected.length === problem.answerSpec.correctOptionIds.length &&
        answer.selected.every((id) =>
          problem.answerSpec.correctOptionIds.includes(id),
        );
      break;
    }
    case "symbolic": {
      if (
        answer.kind !== "quantifiers" ||
        !answer.outer ||
        !answer.inner ||
        !answer.relation
      )
        return {
          valid: false,
          message: "Choose both quantifiers and the relation.",
        };
      const spec = quantifierSpec(problem.answerSpec.correctExpression);
      correct =
        answer.outer === spec.outer &&
        answer.inner === spec.inner &&
        answer.relation === spec.relation;
      break;
    }
    case "proof_ordering": {
      if (
        answer.kind !== "order" ||
        answer.steps.length !== problem.answerSpec.steps.length ||
        new Set(answer.steps).size !== answer.steps.length ||
        !answer.steps.every((id) =>
          problem.answerSpec.steps.some((s) => s.id === id),
        )
      )
        return {
          valid: false,
          message: "Include every proof step exactly once.",
        };
      correct = [
        problem.answerSpec.correctOrder,
        ...problem.answerSpec.alternateValidOrders,
      ].some((order) => order.every((id, i) => id === answer.steps[i]));
      break;
    }
    case "counterexample_builder": {
      if (
        answer.kind !== "number" ||
        !/^[+-]?\d+$/.test(answer.value.trim()) ||
        !Number.isSafeInteger(Number(answer.value))
      )
        return {
          valid: false,
          message:
            "Enter a whole integer within the supported safe integer range.",
        };
      const n = BigInt(answer.value.trim());
      correct = counterexampleCheckers[problem.answerSpec.checker](n);
      break;
    }
    case "proof_fill_blank": {
      if (answer.kind !== "blanks")
        return {
          valid: false,
          message: "Fill in every blank before checking.",
        };
      const blanks = problem.answerSpec.blanks;
      const filled = blanks.every((b) => answer.values[b.id]?.trim());
      if (!filled)
        return {
          valid: false,
          message: "Fill in every blank before checking.",
        };
      correct = blanks.every((b) =>
        b.acceptedValues
          .map((v) => v.trim().toLowerCase())
          .includes(answer.values[b.id]!.trim().toLowerCase()),
      );
      break;
    }
    case "proof_free_response": {
      // Never determines correctness — that comes from AI feedback, recorded
      // as a separate step (docs/grading-policy.md). This only checks the
      // attempt is substantial enough to submit for feedback.
      if (
        answer.kind !== "proof" ||
        proofWordCount(answer.text) < problem.answerSpec.minWords
      )
        return {
          valid: false,
          message: `Write at least ${problem.answerSpec.minWords} words before requesting feedback.`,
        };
      return {
        valid: true,
        correct: false,
        message: "Submitted for feedback.",
      };
    }
    case "numeric": {
      if (
        answer.kind !== "number" ||
        !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(
          answer.value.trim(),
        ) ||
        !Number.isFinite(Number(answer.value))
      )
        return { valid: false, message: "Enter a finite number." };
      const { correctValue, tolerance, toleranceType } = problem.answerSpec;
      correct =
        Math.abs(Number(answer.value) - correctValue) <=
        tolerance * (toleranceType === "relative" ? Math.abs(correctValue) : 1);
    }
  }
  return {
    valid: true,
    correct,
    message: correct
      ? "Correct. Your reasoning is on track."
      : {
          multiple_choice:
            "Not quite. Check the definition and the scope of each quantifier.",
          symbolic:
            "Not quite. Flip each quantifier, then negate the inner predicate.",
          proof_ordering:
            "Not quite. Introduce your witness before checking its properties, then conclude.",
          counterexample_builder:
            "This integer does not disprove the claim. Try a boundary value.",
          numeric: "Not quite. Check your calculation and try again.",
          proof_fill_blank:
            "Not quite. Re-read the definition or rule each blank comes from.",
        }[problem.type],
  };
}
