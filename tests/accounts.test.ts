import { afterAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { lessons } from "../src/lib/content";
import { encodeProgress, newProgress, transition } from "../src/lib/progress";
import {
  openStore,
  passwordHash,
  verifyPassword,
  allowLogin,
} from "../src/lib/account-store";

process.env.CINEMATH_DB_PATH = ":memory:";
const { GET, POST } = await import("../src/app/api/learner/route");
const { store } = await import("../src/lib/account-store");
const origin = "http://localhost:3000";
function request(body: object, cookie = "", requestOrigin = origin) {
  return POST(
    new NextRequest(`${origin}/api/learner`, {
      method: "POST",
      headers: {
        origin: requestOrigin,
        cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}
async function read(cookie: string) {
  return (
    await GET(new NextRequest(`${origin}/api/learner`, { headers: { cookie } }))
  ).json();
}
async function register(username: string) {
  const result = await request({
    action: "register",
    username,
    password: "a-long-test-password",
  });
  expect(result.status).toBe(200);
  const cookie = result.headers.get("set-cookie")!.split(";")[0];
  return { cookie, accountId: (await read(cookie)).account.id as string };
}
afterAll(() => store().close());
describe("account storage and authentication", () => {
  it("salts hashes, verifies passwords and bounds login attempts", () => {
    const hash = passwordHash("correct password");
    expect(hash).not.toEqual(passwordHash("correct password"));
    expect(verifyPassword("correct password", hash)).toBe(true);
    expect(verifyPassword("wrong password", hash)).toBe(false);
    const db = openStore(":memory:");
    for (let i = 0; i < 10; i++)
      expect(allowLogin(db, "learner", 1)).toBe(true);
    expect(allowLogin(db, "learner", 1)).toBe(false);
    expect(allowLogin(db, "learner", 900002)).toBe(true);
    db.close();
  });
  it("rejects cross-origin writes, bad credentials and unauthenticated updates", async () => {
    expect(
      (await request({ action: "register" }, "", "https://other.test")).status,
    ).toBe(403);
    expect((await request({ action: "progress" })).status).toBe(401);
    expect(
      (
        await request({
          action: "register",
          username: "bad",
          password: "short",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request({
          action: "login",
          username: "missing",
          password: "wrong-password",
        })
      ).status,
    ).toBe(401);
  });
  it("persists multiple lessons, isolates users, rejects stale writes and deletes data", async () => {
    const a = await register("learner_a");
    const b = await register("learner_b");
    const data = await read(a.cookie);
    expect(data).not.toHaveProperty("password");
    for (const lesson of lessons.slice(0, 2)) {
      const value = encodeProgress(
        lesson,
        transition(lesson, newProgress(lesson), { type: "start" }),
      );
      const payload = {
        action: "progress",
        accountId: a.accountId,
        lessonId: lesson.lessonId,
        value,
        revision: 0,
      };
      expect((await request(payload, a.cookie)).status).toBe(200);
      expect((await request(payload, a.cookie)).status).toBe(409);
      expect((await request(payload, b.cookie)).status).toBe(409);
      expect(
        (await request({ ...payload, revision: 1, value: "{}" }, a.cookie))
          .status,
      ).toBe(400);
    }
    expect((await read(a.cookie)).progress).toHaveLength(2);
    expect((await read(b.cookie)).progress).toHaveLength(0);
    expect(
      (
        await request(
          {
            action: "profile",
            accountId: a.accountId,
            profile: { displayName: "Ada", reviewReminders: false },
          },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    expect((await read(a.cookie)).profile.displayName).toBe("Ada");
    const login = await request({
      action: "login",
      username: "LEARNER_A",
      password: "a-long-test-password",
    });
    const secondCookie = login.headers.get("set-cookie")!.split(";")[0];
    expect((await read(secondCookie)).progress).toHaveLength(2);
    await request({ action: "logout", accountId: a.accountId }, a.cookie);
    expect((await read(a.cookie)).account).toBeNull();
    expect((await read(secondCookie)).account.id).toBe(a.accountId);
    await request(
      { action: "delete-data", accountId: a.accountId },
      secondCookie,
    );
    expect((await read(secondCookie)).progress).toHaveLength(0);
    expect((await read(secondCookie)).profile.displayName).toBe("");
    await request(
      { action: "delete-account", accountId: a.accountId },
      secondCookie,
    );
    expect((await read(secondCookie)).account).toBeNull();
    expect(
      store()
        .prepare("SELECT * FROM sessions WHERE user_id=?")
        .all(a.accountId),
    ).toHaveLength(0);
    expect((await read(b.cookie)).account.id).toBe(b.accountId);
  });
  it("cascades foreign-key deletes to progress and sessions on account deletion", async () => {
    const c = await register("learner_c");
    const lesson = lessons[0];
    await request(
      {
        action: "progress",
        accountId: c.accountId,
        lessonId: lesson.lessonId,
        value: encodeProgress(
          lesson,
          transition(lesson, newProgress(lesson), { type: "start" }),
        ),
        revision: 0,
      },
      c.cookie,
    );
    expect(
      store()
        .prepare("SELECT * FROM progress WHERE user_id=?")
        .all(c.accountId),
    ).toHaveLength(1);
    await request(
      { action: "delete-account", accountId: c.accountId },
      c.cookie,
    );
    expect(
      store()
        .prepare("SELECT * FROM sessions WHERE user_id=?")
        .all(c.accountId),
    ).toHaveLength(0);
    expect(
      store()
        .prepare("SELECT * FROM progress WHERE user_id=?")
        .all(c.accountId),
    ).toHaveLength(0);
  });
});
