import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { hasSameOrigin } from "../src/lib/request-origin";

describe("browser origins behind local port mappings", () => {
  const request = (origin: string, host = "localhost:3001", extra = {}) =>
    new NextRequest("http://0.0.0.0:3000/api/learner", {
      headers: { origin, host, ...extra },
    });
  it("uses the browser-facing host and port rather than the container address", () => {
    expect(hasSameOrigin(request("http://localhost:3001"))).toBe(true);
    expect(
      hasSameOrigin(request("http://127.0.0.1:3100", "127.0.0.1:3100")),
    ).toBe(true);
    expect(hasSameOrigin(request("http://[::1]:3100", "[::1]:3100"))).toBe(
      true,
    );
  });
  it("still rejects different hosts, ports, schemes, and missing or malformed origins", () => {
    for (const origin of [
      "http://evil.test",
      "http://localhost:3000",
      "https://localhost:3001",
      "null",
      "",
      "http://localhost:3001/path",
    ])
      expect(hasSameOrigin(request(origin))).toBe(false);
    expect(
      hasSameOrigin(
        request("http://evil.test", "localhost:3001", {
          "x-forwarded-host": "evil.test",
        }),
      ),
    ).toBe(false);
    expect(
      hasSameOrigin(request("http://localhost:3001", "localhost:3001/path")),
    ).toBe(false);
  });
});
