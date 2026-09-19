import Link from "next/link";
import type { Course } from "@/lib/content-loader";

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
      {courses.map((course) => (
        <Link
          key={course.slug}
          href={`${path}?course=${course.slug}${path === "/" ? "#course" : ""}`}
          aria-current={course.slug === selected ? "page" : undefined}
        >
          {course.title}
        </Link>
      ))}
    </nav>
  );
}
