# Lesson Template

Copy this structure for every new lesson file at `content/<course-slug>/<module-slug>/<lesson-slug>.json`. Field-by-field guidance is in `docs/content-authoring-guide.md`; grading rules are in `docs/grading-policy.md`.

```json
{
  "lessonId": "string, kebab-case, unique within the course",
  "courseSlug": "string, matches docs/course-map.md",
  "moduleSlug": "string, matches docs/course-map.md",
  "title": "string, learner-facing",
  "learningObjective": "one sentence, singular and explicit",
  "estimatedMinutes": { "min": 10, "max": 25 },
  "prerequisites": ["concept-id", "..."],
  "conceptsIntroduced": ["concept-id", "..."],
  "loop": {
    "retrieve": {
      "bodyMarkdown": "1-2 sentences or one quick question activating prior concepts. Omit/empty for a course's first lesson."
    },
    "encounter": {
      "bodyMarkdown": "A concrete puzzle, example, or failure case. Must not open with a formal definition."
    },
    "explain": {
      "bodyMarkdown": "Only the theory needed for this lesson's objective. KaTeX-compatible math."
    },
    "reflect": {
      "bodyMarkdown": "Why the method(s) worked, and the common error(s) tied to this lesson's misconceptionTags."
    }
  },
  "problems": [
    {
      "id": "string, stable across versions",
      "version": 1,
      "lessonId": "must match lessonId above",
      "type": "multiple_choice | numeric | symbolic | proof_ordering | proof_fill_blank | proof_free_response | counterexample_builder",
      "promptMarkdown": "the question, KaTeX-compatible",
      "answerSpec": "shape depends on type — see docs/content-authoring-guide.md",
      "hints": [
        { "order": 1, "bodyMarkdown": "restate the goal precisely" },
        { "order": 2, "bodyMarkdown": "point to the relevant definition/theorem/strategy" },
        { "order": 3, "bodyMarkdown": "supply the key intermediate observation" },
        { "order": 4, "bodyMarkdown": "worked solution, gated per docs/grading-policy.md" }
      ],
      "solutionMarkdown": "full worked solution explaining strategy, not just the final derivation",
      "concepts": ["concept-id", "..."],
      "prerequisites": ["concept-id", "..."],
      "difficulty": 1,
      "misconceptionTags": ["misconception-id", "..."]
    }
  ],
  "master": {
    "conceptsUpdated": ["concept-id", "..."],
    "notes": "how this lesson's outcomes should be read by the mastery model once it exists (Phase 3); for the first vertical slice, a plain-language summary is enough."
  }
}
```

## Authoring notes

- `problems` must contain exactly 5 entries for a first-vertical-slice lesson (see exit criteria in `ROADMAP.md` → Phase 0).
- Order problems by increasing `difficulty` unless there's a specific pedagogical reason not to (state the reason in a comment field if so — JSON has no comments, so note it in the lesson's PR/commit description instead).
- Every `hints` array must have exactly 4 entries, in strictly increasing specificity.
- Use the content quality checklist in `docs/content-authoring-guide.md` before considering any problem done.
