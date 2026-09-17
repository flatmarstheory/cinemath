import { course, lessons } from "@/lib/content";
import { MathContent } from "@/components/math-content";
import { LessonLink } from "@/components/lesson-link";

export default function Home() {
  return (
    <main id="main" className="course-page">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span className="small-line" /> THINK CLEARLY. PROVE IT.
          </p>
          <h1>
            From following
            <br />
            the idea to
            <br />
            <em>making it yours.</em>
          </h1>
          <p className="hero-description">
            Mathematics makes more sense when you do it. Work through the ideas,
            test your reasoning, and find your own way to the proof.
          </p>
          <a className="text-link" href="#course">
            Explore your first lesson <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="math-art" aria-hidden="true">
          <span className="art-caption">
            A CLAIM. A QUESTION. A POSSIBILITY.
          </span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-equation">
            <MathContent>{"$\\forall$"}</MathContent>
            <span>
              for every idea,
              <br />a new way to think.
            </span>
          </div>
          <span className="art-point point-one" />
          <span className="art-point point-two" />
          <span className="art-bottom">01 — THE LANGUAGE OF PROOF</span>
        </div>
      </section>
      <section id="course" className="course-section">
        <div className="section-intro">
          <p className="eyebrow">YOUR STARTING POINT</p>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <div className="course-details">
            <span>01 available lesson</span>
            <span>5 purposeful problems</span>
            <span>Learn at your pace</span>
          </div>
        </div>
        <div className="lesson-list">
          {lessons.map((lesson, i) => (
            <article className="lesson-card" key={lesson.lessonId}>
              <div className="lesson-card-top">
                <span className="pill">FOUNDATIONS</span>
                <span className="muted">
                  {lesson.estimatedMinutes.min}–{lesson.estimatedMinutes.max}{" "}
                  min
                </span>
              </div>
              <span className="lesson-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="eyebrow">
                {
                  course.modules.find((m) => m.slug === lesson.moduleSlug)
                    ?.title
                }
              </p>
              <h3>{lesson.title}</h3>
              <MathContent>{lesson.learningObjective}</MathContent>
              <div className="lesson-card-bottom">
                <span className="muted">A small lesson. A useful shift.</span>
                <LessonLink lesson={lesson} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="principles" aria-label="How learning works">
        <div>
          <span>01 / WORK IT OUT</span>
          <h3>Your reasoning takes the lead.</h3>
          <p>
            Make a choice, build a statement, or construct a proof. Every
            problem asks you to think.
          </p>
        </div>
        <div>
          <span>02 / FIND YOUR WAY</span>
          <h3>A hint when you need one.</h3>
          <p>
            Small nudges help you move forward. Worked solutions explain why the
            method works.
          </p>
        </div>
        <div>
          <span>03 / MAKE IT STICK</span>
          <h3>See what’s taking shape.</h3>
          <p>
            Finish with an honest picture of your progress and the ideas to keep
            practicing.
          </p>
        </div>
      </section>
    </main>
  );
}
