import Link from "next/link";
import type { Course } from "@/lib/content-loader";
import { Figure } from "./diagrams/figure";
import { courseIconFor } from "@/lib/course-presentation";

export function CourseSwitcher({
  courses,
  selected,
  path,
}: {
  courses: Course[];
  selected: string;
  path: string;
}) {
  return (
    <nav className="course-switcher" aria-label="Choose a course">
      {courses.map((course) => {
        const current = course.slug === selected;
        return (
          <Link
            key={course.slug}
            // No #course hash: every caller already renders this switcher
            // inside (or right above) the section it controls, so forcing
            // an anchor-scroll on every click only produced an abrupt jump.
            href={`${path}?course=${course.slug}`}
            aria-current={current ? "page" : undefined}
            className="course-switcher-card"
          >
            <span className="course-switcher-icon">
              <Figure figure={courseIconFor(course.slug)} />
            </span>
            <span className="course-switcher-label">
              <strong>{course.title}</strong>
              <small>
                {current ? "Currently viewing" : "Switch to this course"}
              </small>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
