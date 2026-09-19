import { NextRequest, NextResponse } from "next/server";
import { allLessons, course, courses } from "@/lib/content";

export const runtime = "nodejs";

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Same operator-only bearer-token gate as the other /api/admin/* routes
// (docs/phase-4.md, docs/phase-5.md) — this product has no author-role
// accounts yet. Read-only: authoring itself stays file-based per
// docs/content-authoring-guide.md ("no import to register, no UI or
// grading code to change"); this route exists so an editor can see a
// lesson's publish status and validation state before it goes live
// (Phase 6, ROADMAP.md "Instructor/editor publishing workflow"), without
// building a full CMS ahead of the authoring pipeline this product
// actually needs.
function authorized(req: NextRequest) {
  const token = process.env.CINEMATH_ADMIN_TOKEN;
  return !!token && req.headers.get("x-admin-token") === token;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return response({ error: "Unauthorized." }, 401);
  return response({
    course,
    courses,
    lessons: allLessons.map((lesson) => ({
      lessonId: lesson.lessonId,
      title: lesson.title,
      courseTitle: courses.find((c) => c.slug === lesson.courseSlug)!.title,
      moduleSlug: lesson.moduleSlug,
      moduleTitle:
        courses
          .find((c) => c.slug === lesson.courseSlug)
          ?.modules.find((m) => m.slug === lesson.moduleSlug)?.title ??
        lesson.moduleSlug,
      kind: lesson.kind,
      status: lesson.status,
      problemCount: lesson.problems.length,
      conceptsIntroduced: lesson.conceptsIntroduced,
    })),
  });
}
