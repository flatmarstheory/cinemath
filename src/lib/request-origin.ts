import type { NextRequest } from "next/server";

// NextURL normalizes loopback addresses to localhost, and its port may be the
// container's internal port. Browser Origin must match the actual HTTP Host.
// Do not trust X-Forwarded-Host supplied by a caller.
export function hasSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("host") || req.nextUrl.host;
  if (!/^[a-z0-9.\-\[\]:]+$/i.test(host)) return false;
  try {
    const expected = new URL(`${req.nextUrl.protocol}//${host}`);
    return (
      (expected.protocol === "http:" || expected.protocol === "https:") &&
      origin === expected.origin
    );
  } catch {
    return false;
  }
}
