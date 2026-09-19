import { z } from "zod";

// Deliberately closed set of author-selectable checkers, not arbitrary code — see docs/content-authoring-guide.md.
export const counterexampleCheckerIds = [
  "integer-square-not-greater",
  "integer-even-with-even-square",
] as const;
export type CounterexampleCheckerId = (typeof counterexampleCheckerIds)[number];

const text = z.string().min(1);
const ids = z.array(text);
const base = {
  id: text,
  version: z.number().int().positive(),
  lessonId: text,
  promptMarkdown: text,
  hints: z
    .array(
      z.object({ order: z.number().int().min(1).max(4), bodyMarkdown: text }),
    )
    .length(4)
    .refine(
      (hints) => hints.every((hint, i) => hint.order === i + 1),
      "Hints must be ordered 1–4",
    ),
  solutionMarkdown: text,
  concepts: ids.min(1),
  prerequisites: ids,
  difficulty: z.number().int().min(1).max(5),
  misconceptionTags: ids,
};
const option = z.object({ id: text, label: text, accessibleLabel: text });
export const problemSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("multiple_choice"),
    answerSpec: z
      .object({
        options: z.array(option).min(2),
        correctOptionIds: ids.min(1),
      })
      .refine(
        (s) =>
          new Set(s.options.map((o) => o.id)).size === s.options.length &&
          new Set(s.correctOptionIds).size === s.correctOptionIds.length &&
          s.correctOptionIds.every((id) => s.options.some((o) => o.id === id)),
        "Option ids must be unique and correct ids must exist",
      ),
  }),
  z.object({
    ...base,
    type: z.literal("numeric"),
    answerSpec: z.object({
      correctValue: z.number().finite(),
      tolerance: z.number().nonnegative().finite(),
      toleranceType: z.enum(["absolute", "relative"]),
    }),
  }),
  z.object({
    ...base,
    type: z.literal("symbolic"),
    answerSpec: z.object({
      correctExpression: text,
      equivalenceForm: z.literal("quantifier-negation-normal-form"),
    }),
  }),
  z.object({
    ...base,
    type: z.literal("proof_ordering"),
    answerSpec: z
      .object({
        steps: z.array(z.object({ id: text, textMarkdown: text })).min(2),
        correctOrder: ids.min(2),
        alternateValidOrders: z.array(ids).default([]),
      })
      .refine((s) => {
        const stepIds = s.steps.map((step) => step.id);
        return (
          new Set(stepIds).size === stepIds.length &&
          [s.correctOrder, ...s.alternateValidOrders].every(
            (order) =>
              order.length === stepIds.length &&
              new Set(order).size === stepIds.length &&
              order.every((id) => stepIds.includes(id)),
          )
        );
      }, "Each valid ordering must contain every step exactly once"),
  }),
  z.object({
    ...base,
    type: z.literal("counterexample_builder"),
    answerSpec: z.object({
      constraints: ids,
      predicateDescription: text,
      checkerNotes: text,
      checker: z.enum(counterexampleCheckerIds),
    }),
  }),
  z.object({
    ...base,
    type: z.literal("proof_fill_blank"),
    answerSpec: z
      .object({
        blanks: z
          .array(
            z.object({
              id: text,
              label: text,
              acceptedValues: text.array().min(1),
            }),
          )
          .min(1),
      })
      .refine(
        (s) => new Set(s.blanks.map((b) => b.id)).size === s.blanks.length,
        "Blank ids must be unique",
      ),
  }),
  z.object({
    ...base,
    type: z.literal("proof_free_response"),
    // A rubric reference for AI-assisted feedback (docs/grading-policy.md),
    // not a gradable spec — this type is never graded deterministically.
    answerSpec: z
      .object({
        rubric: z
          .array(z.object({ id: text, description: text }))
          .min(1),
        minWords: z.number().int().positive(),
      })
      .refine(
        (s) => new Set(s.rubric.map((r) => r.id)).size === s.rubric.length,
        "Rubric ids must be unique",
      ),
  }),
]);
const section = z.object({ bodyMarkdown: z.string() });
export const lessonSchema = z
  .object({
    lessonId: text,
    courseSlug: text,
    moduleSlug: text,
    title: text,
    learningObjective: text,
    estimatedMinutes: z
      .object({ min: z.number().positive(), max: z.number().positive() })
      .refine((s) => s.max >= s.min),
    prerequisites: ids,
    conceptsIntroduced: ids,
    loop: z.object({
      retrieve: section,
      encounter: section,
      explain: section,
      reflect: section,
    }),
    problems: z.array(problemSchema).min(1),
    master: z.object({ conceptsUpdated: ids, notes: text }),
  })
  .superRefine((lesson, ctx) => {
    if (
      new Set(lesson.problems.map((p) => p.id)).size !== lesson.problems.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Problem ids must be unique",
        path: ["problems"],
      });
    lesson.problems.forEach((p, i) => {
      if (p.lessonId !== lesson.lessonId)
        ctx.addIssue({
          code: "custom",
          message: "Problem belongs to another lesson",
          path: ["problems", i, "lessonId"],
        });
    });
  });
export type Problem = z.infer<typeof problemSchema>;
export type Lesson = z.infer<typeof lessonSchema>;

export const answerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), selected: ids }),
  z.object({ kind: z.literal("number"), value: z.string() }),
  z.object({ kind: z.literal("order"), steps: ids }),
  z.object({
    kind: z.literal("quantifiers"),
    outer: z.enum(["", "forall", "exists"]),
    inner: z.enum(["", "forall", "exists"]),
    relation: z.enum(["", "=", "neq"]),
  }),
  z.object({ kind: z.literal("blanks"), values: z.record(text, z.string()) }),
  z.object({ kind: z.literal("proof"), text: z.string() }),
]);
export type Answer = z.infer<typeof answerSchema>;
