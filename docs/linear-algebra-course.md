# Linear Algebra Beyond Computation

This expansion adds one free course and refreshes the existing account form.
Other Phase 7 work (payments, subscriptions, pricing, institutions, and further
courses) is outside this change.

## Learner and outcome

For learners comfortable with elementary algebra who want to explain why linear
algebra works. Familiarity with proof reasoning is recommended; the existing
Proofs for Modern Mathematics course supplies that foundation. No calculus is
required. All vector spaces and inner products are real; finite-dimensional
hypotheses and nonzero-vector requirements are stated where needed.

The course has 6 modules, 13 lessons, 65 deterministically graded problems, and
20 glossary terms. Each lesson takes approximately 10–25 minutes and includes
retrieval, a motivating example, explanation, five problems, progressive hints,
worked solutions, and reflection. Two lessons are checkpoints; the final lesson
is a capstone. Each module ends with a proof-ordering assessment in its final
lesson, alongside concept and numerical questions.

| Module                            | Lessons                                                                                                           | Outcome and assessment                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Vector spaces and subspaces       | Vectors are more than arrows; Subspaces: a test that proves something                                             | Apply axioms and prove closure; assess the intersection subspace proof and a union counterexample.              |
| Span, independence, and dimension | Generating a space without redundancy; A basis makes coordinates unique (checkpoint)                              | Distinguish spanning from independence and justify coordinate uniqueness.                                       |
| Linear maps and rank–nullity      | A transformation is determined by a basis; What a map loses and what it reaches (checkpoint)                      | Interpret kernel/image and prove the zero-kernel injectivity criterion.                                         |
| Coordinates and determinants      | A matrix is a map in coordinates; Determinants measure collapse                                                   | Derive change of basis and connect determinant multiplicativity to invertibility.                               |
| Eigenvalues and diagonalization   | Directions a transformation preserves; An eigenbasis simplifies repeated action                                   | Count eigenvectors correctly, recognize a defective shear, and prove independence for two distinct eigenvalues. |
| Orthogonality and synthesis       | Orthogonality gives the closest point; From orthonormal bases to least squares; Capstone: recognize the structure | Justify projection, normal equations, and symmetric idempotent operators.                                       |

The real spectral theorem is stated and applied, not proved in full. This is a
focused structural introduction, not coverage of Jordan form, SVD, dual spaces,
or an entire university sequence. Examples, explanations, and questions are
original to this course. Topic coverage was cross-checked against the
[MIT 18.700 syllabus](https://ocw.mit.edu/courses/18-700-linear-algebra-fall-2013/pages/syllabus/).

## Integration and authoring

`content/catalog.json` now has a `courses` array. The loader still accepts the
original single-course shape for existing tools and fixtures. Each lesson must
name a module owned by its own course. Course and lesson IDs must be unique;
glossary concept IDs are globally unique because mastery and glossary anchors
use them directly. The new course uses the `labc-` lesson prefix and `la-`
concept prefix. Existing lesson IDs and storage keys retain their meaning.

The home page, prerequisite map, and certificate use `?course=<slug>`; omitting
it selects the original course. Unknown course slugs return 404. Lesson headings
and return links use the lesson's course, with numbering restarting per course.
Search, glossary, dashboard, and review include both courses. Certificates count
only lessons belonging to the selected course. No payment or access gate exists.

Browser writes compare their Origin with the HTTP Host rather than Next.js's
normalized internal URL, so loopback addresses and Docker port mappings work
while cross-origin requests remain rejected. No forwarded host header is trusted.

To open the new course locally, visit
`/?course=linear-algebra-beyond-computation#course`.

## Checks and review

The content validator checks both catalogs and all lesson schemas. Tests cover
course ownership, prerequisite order, glossary coverage, all answer types,
independently calculated numeric keys, math rendering, lesson persistence, and
certificate isolation. Browser checks cover both account modes, password
visibility, server errors, registration and login, keyboard submission, and
desktop/mobile accessibility.

The authored content received a second pass for mathematical assumptions,
numerical answers, and progressively specific hints. Automated validation and
this author review do not constitute independent expert peer review; that
editorial review remains a release step before presenting the course as
peer-reviewed.
