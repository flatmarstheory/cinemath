import { z } from "zod";

// Deliberately closed set of author-selectable checkers, not arbitrary code — see docs/content-authoring-guide.md.
export const counterexampleCheckerIds = [
  "integer-square-not-greater",
  "integer-even-with-even-square",
] as const;
export type CounterexampleCheckerId = (typeof counterexampleCheckerIds)[number];

const text = z.string().min(1);
const ids = z.array(text);

// Closed set of author-selectable plot functions, not arbitrary code — same
// pattern as counterexampleCheckerIds. Keeps figures deterministic and
// avoids building a computer algebra system (ROADMAP.md non-goal).
export const functionPresetIds = [
  "identity",
  "square",
  "cube",
  "reciprocal",
  "abs",
  "sqrt",
  "sin",
  "floor",
  "exp",
  "negation",
  "constant-zero",
  "triangular",
  "power-of-two",
] as const;
export type FunctionPresetId = (typeof functionPresetIds)[number];

const point2 = z.object({ x: z.number(), y: z.number() });
const swatch = z.enum(["primary", "accent", "muted"]).default("primary");

// A small library of illustrative diagrams authors can attach to a lesson
// section or a problem, alongside the markdown — see
// docs/content-authoring-guide.md. Rendered as accessible inline SVG by
// src/components/diagrams. Deliberately a closed set of chart *kinds*, not a
// general drawing DSL, to stay a "simple, testable component" (CLAUDE.md).
export const figureSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("number-line"),
    caption: text,
    min: z.number(),
    max: z.number(),
    points: z
      .array(
        z.object({
          value: z.number(),
          label: text,
          style: z.enum(["include", "exclude"]).default("include"),
        }),
      )
      .default([]),
    intervals: z
      .array(
        z.object({
          from: z.number(),
          to: z.number(),
          closedFrom: z.boolean().default(true),
          closedTo: z.boolean().default(true),
          label: text.optional(),
        }),
      )
      .default([]),
  }),
  z.object({
    kind: z.literal("function-plot"),
    caption: text,
    domain: z.tuple([z.number(), z.number()]),
    range: z.tuple([z.number(), z.number()]).optional(),
    curves: z
      .array(
        z.object({
          preset: z.enum(functionPresetIds),
          label: text,
          color: swatch,
        }),
      )
      .min(1),
    markedPoints: z
      .array(z.object({ x: z.number(), y: z.number(), label: text }))
      .default([]),
  }),
  z.object({
    kind: z.literal("set-diagram"),
    caption: text,
    sets: z.array(z.object({ id: text, label: text })).min(2).max(3),
    shadedRegions: z
      .array(ids.min(1))
      .default([])
      .describe("Each entry lists the set ids whose intersection is shaded."),
    elements: z
      .array(z.object({ label: text, memberOf: ids }))
      .default([])
      .describe("memberOf lists the set ids this element belongs to (empty = outside every set)."),
  }),
  z.object({
    kind: z.literal("vector-plane"),
    caption: text,
    xRange: z.tuple([z.number(), z.number()]),
    yRange: z.tuple([z.number(), z.number()]),
    vectors: z
      .array(
        z.object({
          from: point2.default({ x: 0, y: 0 }),
          to: point2,
          label: text,
          color: swatch,
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("relation-graph"),
    caption: text,
    nodes: z.array(z.object({ id: text, label: text })).min(1),
    edges: z
      .array(
        z.object({
          from: text,
          to: text,
          directed: z.boolean().default(true),
        }),
      )
      .default([]),
  }),
  z.object({
    kind: z.literal("matrix-grid"),
    caption: text,
    rows: z.array(z.array(z.number()).min(1)).min(1),
    highlight: z
      .array(z.tuple([z.number(), z.number()]))
      .default([])
      .describe("Zero-indexed [row, col] cells to emphasize."),
  }),
]);
export type Figure = z.infer<typeof figureSchema>;

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
  figure: figureSchema.optional(),
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
const section = z.object({
  bodyMarkdown: z.string(),
  figure: figureSchema.optional(),
});
// "checkpoint" and "capstone" are the same gradable/authorable Lesson shape
// (Phase 6, ROADMAP.md) — only their UI framing and course-page grouping
// differ (docs/course-map.md). "draft" content is excluded from the public
// course by src/lib/content.ts but still validated and previewable by
// authors/admins (Phase 6 "Instructor/editor publishing workflow").
export const lessonKinds = ["lesson", "checkpoint", "capstone"] as const;
export type LessonKind = (typeof lessonKinds)[number];
export const lessonSchema = z
  .object({
    lessonId: text,
    courseSlug: text,
    moduleSlug: text,
    title: text,
    kind: z.enum(lessonKinds).default("lesson"),
    status: z.enum(["draft", "published"]).default("published"),
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

// Course glossary (Phase 6, ROADMAP.md "Content search and glossary
// linking"). A term's `id` is a concept id, the same kebab-case ids used by
// `Problem.concepts`/`conceptsIntroduced`, so lesson content and the
// glossary always share one vocabulary (docs/content-authoring-guide.md).
export const glossaryTermSchema = z.object({
  id: text,
  term: text,
  definitionMarkdown: text,
  relatedTerms: ids.default([]),
});
export const glossarySchema = z.object({
  courseSlug: text,
  terms: z.array(glossaryTermSchema).min(1),
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;
export type Glossary = z.infer<typeof glossarySchema>;
