import { z } from "zod";

// Shared between server (src/lib/ai-feedback.ts, the API route) and client
// (progress.ts, lesson-player.tsx). Contains no provider keys or prompts —
// safe to import from client code. Categories match docs/grading-policy.md.
export const proofFeedbackCategories = [
  "correct",
  "mostly_correct",
  "needs_revision",
  "insufficient",
] as const;
export type ProofFeedbackCategory = (typeof proofFeedbackCategories)[number];

export const proofFeedbackResultSchema = z.object({
  category: z.enum(proofFeedbackCategories),
  rationale: z.string().min(1).max(2000),
  nextStep: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string().min(1),
  // true when the model was unavailable or returned unusable output and this
  // is a deterministic fallback, not a real grading result.
  fallback: z.boolean(),
});
export type ProofFeedbackResult = z.infer<typeof proofFeedbackResultSchema>;

export const LOW_CONFIDENCE_THRESHOLD = 0.5;
