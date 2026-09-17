"use client";
import { MathContent } from "./math-content";
import { quantifierSpec } from "@/lib/grading";
import type { Answer, Problem } from "@/lib/schema";

export function AnswerInput({
  problem,
  answer,
  onChange,
  disabled,
}: {
  problem: Problem;
  answer: Answer;
  onChange: (answer: Answer) => void;
  disabled: boolean;
}) {
  if (problem.type === "multiple_choice" && answer.kind === "choice") {
    const multiple = problem.answerSpec.correctOptionIds.length > 1;
    return (
      <fieldset className="answer-options" disabled={disabled}>
        <legend>
          {multiple ? "Select all that apply" : "Choose one answer"}
        </legend>
        {problem.answerSpec.options.map((option) => (
          <label
            key={option.id}
            className={`answer-option ${answer.selected.includes(option.id) ? "selected" : ""}`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={problem.id}
              value={option.id}
              aria-label={`Option ${option.id.toUpperCase()}: ${option.accessibleLabel}`}
              checked={answer.selected.includes(option.id)}
              onChange={() =>
                onChange({
                  kind: "choice",
                  selected: multiple
                    ? answer.selected.includes(option.id)
                      ? answer.selected.filter((id) => id !== option.id)
                      : [...answer.selected, option.id]
                    : [option.id],
                })
              }
            />
            <span className="option-letter" aria-hidden="true">
              {option.id.toUpperCase()}
            </span>
            <MathContent>{option.label}</MathContent>
          </label>
        ))}
      </fieldset>
    );
  }
  if (problem.type === "symbolic" && answer.kind === "quantifiers") {
    const spec = quantifierSpec(problem.answerSpec.correctExpression);
    return (
      <fieldset className="structured-answer" disabled={disabled}>
        <legend>Build the negated statement</legend>
        <p className="muted">
          Keep the variables and domain. Choose each quantifier and the inner
          relation.
        </p>
        <div className="quantifier-controls">
          <label>
            Outer quantifier
            <select
              value={answer.outer}
              onChange={(e) =>
                onChange({
                  ...answer,
                  outer: e.target.value as typeof answer.outer,
                })
              }
            >
              <option value="">Choose…</option>
              <option value="forall">For every (∀)</option>
              <option value="exists">There exists (∃)</option>
            </select>
          </label>
          <label>
            Inner quantifier
            <select
              value={answer.inner}
              onChange={(e) =>
                onChange({
                  ...answer,
                  inner: e.target.value as typeof answer.inner,
                })
              }
            >
              <option value="">Choose…</option>
              <option value="forall">For every (∀)</option>
              <option value="exists">There exists (∃)</option>
            </select>
          </label>
          <label>
            Relation
            <select
              value={answer.relation}
              onChange={(e) =>
                onChange({
                  ...answer,
                  relation: e.target.value as typeof answer.relation,
                })
              }
            >
              <option value="">Choose…</option>
              <option value="=">Equals (=)</option>
              <option value="neq">Does not equal (≠)</option>
            </select>
          </label>
        </div>
        <div className="answer-preview" aria-live="polite">
          <span className="eyebrow">YOUR STATEMENT</span>
          <MathContent>{`$$${answer.outer ? `\\${answer.outer}` : "\\square"} ${spec.first} \\in \\mathbb{R},\\quad ${answer.inner ? `\\${answer.inner}` : "\\square"} ${spec.second} \\in \\mathbb{R},\\quad ${spec.first}+${spec.second} ${answer.relation === "neq" ? "\\neq" : answer.relation || "\\square"} 0$$`}</MathContent>
        </div>
      </fieldset>
    );
  }
  if (problem.type === "proof_ordering" && answer.kind === "order") {
    const move = (index: number, direction: number) => {
      const steps = [...answer.steps];
      [steps[index], steps[index + direction]] = [
        steps[index + direction],
        steps[index],
      ];
      onChange({ kind: "order", steps });
    };
    return (
      <fieldset disabled={disabled}>
        <legend>Arrange the proof</legend>
        <p className="muted">Use the up and down buttons to move each step.</p>
        <ol className="proof-steps" aria-live="polite">
          {answer.steps.map((id, index) => (
            <li key={id}>
              <span className="step-number">{index + 1}</span>
              <MathContent>
                {problem.answerSpec.steps.find((step) => step.id === id)
                  ?.textMarkdown ?? ""}
              </MathContent>
              <div className="step-actions">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  aria-label={`Move step ${index + 1} up`}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || index === answer.steps.length - 1}
                  aria-label={`Move step ${index + 1} down`}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>
    );
  }
  if (answer.kind === "number")
    return (
      <fieldset disabled={disabled}>
        <legend>
          {problem.type === "counterexample_builder"
            ? "Your counterexample"
            : "Your answer"}
        </legend>
        <label className="number-label">
          {problem.type === "counterexample_builder" ? "Integer n" : "Number"}
          <input
            type="text"
            inputMode={
              problem.type === "counterexample_builder" ? "text" : "decimal"
            }
            value={answer.value}
            onChange={(e) =>
              onChange({ kind: "number", value: e.target.value })
            }
            autoComplete="off"
            placeholder="Enter a number"
          />
        </label>
        {problem.type === "numeric" && (
          <p className="muted">
            Tolerance: {problem.answerSpec.tolerance} (
            {problem.answerSpec.toleranceType}).
          </p>
        )}
      </fieldset>
    );
  return null;
}
