import type { Metadata } from "next";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineMath · Learn by reasoning",
  description:
    "A hands-on introduction to proof-based mathematics. Five problems, progressive hints, and room to think.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-symbol" aria-hidden="true">
              c∴
            </span>
            CineMath<span className="brand-dot">.</span>
          </Link>
          <span className="header-note">
            A little clarity. A deeper understanding.
          </span>
          <Link href="/dashboard" className="header-dashboard-link">
            Your dashboard
          </Link>
          <span className="edition">THE FIRST CHAPTER</span>
        </header>
        {children}
        <footer className="site-footer">
          <span>CineMath · Mathematics, made active.</span>
          <span>Practice as a guest, or sign in to save across devices.</span>
        </footer>
      </body>
    </html>
  );
}
