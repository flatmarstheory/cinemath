import { z } from "zod";
import type { Problem } from "./schema";
import {
  proofFeedbackCategories,
  type ProofFeedbackResult,
} from "./proof-feedback-schema";

// Server-side only: reads ANTHROPIC_API_KEY and builds prompts. Never import
// this file from a client component (src/lib/proof-feedback-schema.ts holds
// the client-safe types). See docs/grading-policy.md.

export const AI_FEEDBACK_MODEL = "claude-sonnet-5";

export function proofFeedbackEnabled() {
  return process.env.CINEMATH_AI_FEEDBACK_ENABLED === "1";
}

type ProofFreeResponseProblem = Extract<
  Problem,
  { type: "proof_free_response" }
>;

// Grounds the model in exactly this problem's rubric and reference solution
// — nothing about the learner's identity or history (docs/grading-policy.md:
// "Receive only what's needed to grade").
export function buildProofFeedbackPrompt(
  problem: ProofFreeResponseProblem,
  proofText: string,
) {
  const rubric = problem.answerSpec.rubric
    .map((item) => `- ${item.id}: ${item.description}`)
    .join("\n");
  const system = [
    "You are an educational assistant for CineMath, a proof-based mathematics learning platform.",
    "You give short, constructive feedback on a learner's written proof attempt, grounded ONLY in the rubric and reference solution provided below.",
    "You are NOT a formal verifier, proof checker, or theorem prover. Never claim to have formally verified, checked, or proven the argument correct or complete — present your response only as educational feedback.",
    "Never invent rubric requirements that are not listed below.",
    "Prefer diagnosing the specific gap and suggesting one concrete next step over rewriting the proof or revealing the full reference solution.",
    "Classify the attempt into exactly one category: correct, mostly_correct, needs_revision, or insufficient.",
    "Respond only by calling the submit_feedback tool.",
  ].join(" ");
  const user = [
    `Problem prompt:\n${problem.promptMarkdown}`,
    `Rubric:\n${rubric}`,
    `Reference solution (for grounding only — never quote it verbatim to the learner):\n${problem.solutionMarkdown}`,
    `Learner's proof attempt:\n${proofText}`,
  ].join("\n\n");
  return { system, user };
}

const modelOutputSchema = z.object({
  category: z.enum(proofFeedbackCategories),
  rationale: z.string().min(1).max(2000),
  nextStep: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
});

export type ModelUsage = { inputTokens: number; outputTokens: number };
export type ModelCall = (args: {
  system: string;
  user: string;
}) => Promise<{ input: unknown; usage: ModelUsage | null }>;

// Uses the Anthropic Messages API directly over fetch (no SDK dependency)
// with forced tool use, so the response is structured output, not prose.
export const callAnthropic: ModelCall = async ({ system, user }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_FEEDBACK_MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }],
      tools: [
        {
          name: "submit_feedback",
          description:
            "Return structured educational feedback on the learner's proof attempt.",
          input_schema: {
            type: "object",
            properties: {
              category: { type: "string", enum: [...proofFeedbackCategories] },
              rationale: { type: "string" },
              nextStep: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["category", "rationale", "nextStep", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_feedback" },
    }),
  });
  if (!response.ok)
    throw new Error(`AI provider responded with status ${response.status}`);
  const body = (await response.json()) as {
    content?: Array<{ type: string; input?: unknown }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const toolUse = body.content?.find((block) => block.type === "tool_use");
  const usage = body.usage
    ? {
        inputTokens: body.usage.input_tokens ?? 0,
        outputTokens: body.usage.output_tokens ?? 0,
      }
    : null;
  return { input: toolUse?.input, usage };
};

export function fallbackFeedback(): ProofFeedbackResult {
  return {
    category: "insufficient",
    rationale:
      "AI feedback is temporarily unavailable, so this attempt could not be reviewed automatically.",
    nextStep:
      "You can keep revising from your notes, or continue — this never blocks lesson completion.",
    confidence: 0,
    modelVersion: "unavailable",
    fallback: true,
  };
}

export type GradeProofResult = {
  result: ProofFeedbackResult;
  usage: ModelUsage | null;
};

// Calls the model, validates its structured output, and retries once on a
// malformed response before degrading to a deterministic fallback — a
// failed or malformed AI response must never throw out to the caller
// (docs/grading-policy.md: "does not block lesson completion").
export async function gradeProofAttempt(
  problem: ProofFreeResponseProblem,
  proofText: string,
  options: { call?: ModelCall; retries?: number } = {},
): Promise<GradeProofResult> {
  const call = options.call ?? callAnthropic;
  const retries = options.retries ?? 1;
  const { system, user } = buildProofFeedbackPrompt(problem, proofText);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { input, usage } = await call({ system, user });
      const parsed = modelOutputSchema.parse(input);
      return {
        result: {
          ...parsed,
          modelVersion: AI_FEEDBACK_MODEL,
          fallback: false,
        },
        usage,
      };
    } catch {
      // retry, then fall back below
    }
  }
  return { result: fallbackFeedback(), usage: null };
}
