import { z } from "zod";

// A lightweight, optional self-report shown on lesson completion. It maps to
// ROADMAP.md Phase 5's "Measure" and "Interview questions" lists as a
// structured proxy for the qualitative parts a real interview would cover —
// it does not replace running actual learner interviews.
export const feedbackSchema = z.object({
  learnerId: z.string().min(1).max(100),
  lessonId: z.string().min(1),
  clarity: z.enum(["confusing", "somewhat_clear", "clear", "very_clear"]),
  challenge: z.enum(["too_easy", "just_right", "too_hard"]),
  hintsHelped: z.enum(["yes", "gave_too_much_away", "did_not_use"]),
  wouldReturnTomorrow: z.boolean(),
  willingToContinuePaid: z.enum(["yes", "maybe", "no"]),
  mostEngaging: z.string().max(1000).optional(),
  mostConfusing: z.string().max(1000).optional(),
  nextTopic: z.string().max(300).optional(),
  comments: z.string().max(2000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
