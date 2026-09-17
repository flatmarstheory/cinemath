import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <p className="eyebrow">A DIFFERENT PATH</p>
      <h1>This lesson isn’t here.</h1>
      <Link className="button" href="/">
        Back to course
      </Link>
    </main>
  );
}
