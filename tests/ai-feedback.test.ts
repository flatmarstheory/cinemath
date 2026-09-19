import { describe, expect, it } from "vitest";
import { lessons } from "../src/lib/content";
import {
  buildProofFeedbackPrompt,
  fallbackFeedback,
  gradeProofAttempt,
  type ModelCall,
} from "../src/lib/ai-feedback";
import { proofFeedbackResultSchema } from "../src/lib/proof-feedback-schema";

const lesson4 = lessons.find(
  (l) => l.lessonId === "pfmm-m1-l4-reading-and-writing-formal-definitions",
)!;
const problem = lesson4.problems.find(
  (p) => p.type === "proof_free_response",
)!;
if (problem.type !== "proof_free_response") throw new Error("fixture setup");

describe("proof feedback prompt", () => {
  it("grounds the prompt in exactly this problem's rubric and reference solution", () => {
    const { system, user } = buildProofFeedbackPrompt(problem, "my proof");
    expect(system).toContain("NOT a formal verifier");
    expect(system).toContain("Never invent rubric requirements");
    for (const item of problem.answerSpec.rubric)
      expect(user).toContain(item.description);
    expect(user).toContain(problem.solutionMarkdown);
    expect(user).toContain("my proof");
  });
});

describe("gradeProofAttempt", () => {
  it("returns a validated result for well-formed model output", async () => {
    const call: ModelCall = async () => ({
      input: {
        category: "correct",
        rationale: "Uses the definition and computes correctly.",
        nextStep: "Nothing further needed.",
        confidence: 0.92,
      },
      usage: { inputTokens: 300, outputTokens: 80 },
    });
    const { result, usage } = await gradeProofAttempt(problem, "n=2k+1...", {
      call,
    });
    expect(proofFeedbackResultSchema.parse(result)).toMatchObject({
      category: "correct",
      fallback: false,
    });
    expect(usage).toEqual({ inputTokens: 300, outputTokens: 80 });
  });

  it("retries once on malformed output, then falls back deterministically", async () => {
    let calls = 0;
    const call: ModelCall = async () => {
      calls++;
      return { input: { category: "not-a-real-category" }, usage: null };
    };
    const { result } = await gradeProofAttempt(problem, "text", {
      call,
      retries: 1,
    });
    expect(calls).toBe(2);
    expect(result).toMatchObject({ category: "insufficient", fallback: true });
    expect(result.confidence).toBe(0);
  });

  it("falls back when the model call throws (provider unavailable)", async () => {
    const call: ModelCall = async () => {
      throw new Error("network down");
    };
    const { result, usage } = await gradeProofAttempt(problem, "text", {
      call,
      retries: 0,
    });
    expect(result).toEqual(fallbackFeedback());
    expect(usage).toBeNull();
  });

  it("never blocks on a low-confidence but well-formed response", async () => {
    const call: ModelCall = async () => ({
      input: {
        category: "needs_revision",
        rationale: "Missing the witness integer.",
        nextStep: "Introduce k explicitly.",
        confidence: 0.2,
      },
      usage: { inputTokens: 200, outputTokens: 50 },
    });
    const { result } = await gradeProofAttempt(problem, "text", { call });
    expect(result.fallback).toBe(false);
    expect(result.confidence).toBe(0.2);
  });
});
