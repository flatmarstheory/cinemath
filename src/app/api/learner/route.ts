import { NextRequest, NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/request-origin";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  store,
  hashToken,
  passwordHash,
  verifyPassword,
  allowLogin,
} from "@/lib/account-store";
import { lessons } from "@/lib/content";
import { decodeProgress } from "@/lib/progress";
import { masteryForCourse } from "@/lib/mastery";

export const runtime = "nodejs";
const cookie = "cinemath_session";
const profileSchema = z.object({
  displayName: z.string().max(60),
  reviewReminders: z.boolean(),
});
const credentials = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{3,40}$/)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});
function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function user(req: NextRequest) {
  return store()
    .prepare(
      "SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?",
    )
    .get(hashToken(req.cookies.get(cookie)?.value || ""), Date.now());
}
export async function GET(req: NextRequest) {
  const account = user(req);
  if (!account) return response({ account: null });
  const progress = store()
    .prepare("SELECT lesson_id, value, revision FROM progress WHERE user_id=?")
    .all(account.id);
  const map = new Map();
  for (const row of progress) {
    const lesson = lessons.find((l) => l.lessonId === row.lesson_id);
    if (lesson) {
      try {
        map.set(lesson.lessonId, decodeProgress(lesson, String(row.value)));
      } catch {
        /* Export retains older content versions. */
      }
    }
  }
  return response({
    account: { id: account.id, username: account.username },
    profile: JSON.parse(String(account.profile)),
    progress,
    mastery: masteryForCourse(lessons, map),
  });
}
export async function POST(req: NextRequest) {
  if (!hasSameOrigin(req))
    return response({ error: "Invalid request origin." }, 403);
  if (Number(req.headers.get("content-length") || 0) > 2000000)
    return response({ error: "Request too large." }, 413);
  try {
    const raw = await req.text();
    if (raw.length > 2000000)
      return response({ error: "Request too large." }, 413);
    const body = JSON.parse(raw);
    const db = store();
    if (body.action === "register" || body.action === "login") {
      const { username, password } = credentials.parse(body);
      if (!allowLogin(db, username))
        return response(
          { error: "Too many attempts. Try again in 15 minutes." },
          429,
        );
      let account = db
        .prepare("SELECT * FROM users WHERE username=?")
        .get(username);
      if (body.action === "register") {
        if (account)
          return response({ error: "That username is unavailable." }, 409);
        const id = randomUUID();
        db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run(
          id,
          username,
          passwordHash(password),
          JSON.stringify({ displayName: "", reviewReminders: true }),
        );
        account = { id };
      } else if (
        !verifyPassword(
          password,
          String(account?.password || passwordHash("dummy-password")),
        ) ||
        !account
      ) {
        return response({ error: "Invalid username or password." }, 401);
      }
      const token = randomBytes(32).toString("hex");
      db.prepare("DELETE FROM sessions WHERE expires <= ? OR token=?").run(
        Date.now(),
        hashToken(req.cookies.get(cookie)?.value || ""),
      );
      db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(
        hashToken(token),
        account!.id,
        Date.now() + 30 * 86400000,
      );
      const res = response({ ok: true });
      res.cookies.set(cookie, token, {
        httpOnly: true,
        secure: req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86400,
      });
      return res;
    }
    const account = user(req);
    if (!account)
      return response({ error: "Sign in again before saving." }, 401);
    if (body.accountId !== account.id)
      return response(
        { error: "Account changed. Reload before continuing." },
        409,
      );
    if (body.action === "logout" || body.action === "delete-account") {
      if (body.action === "delete-account") {
        db.prepare("DELETE FROM users WHERE id=?").run(account.id);
        db.prepare("DELETE FROM analytics_events WHERE learner_id=?").run(
          account.id,
        );
        db.prepare("DELETE FROM feedback_responses WHERE learner_id=?").run(
          account.id,
        );
      } else
        db.prepare("DELETE FROM sessions WHERE token=?").run(
          hashToken(req.cookies.get(cookie)!.value),
        );
      const res = response({ ok: true });
      res.cookies.delete(cookie);
      return res;
    }
    if (body.action === "delete-data") {
      db.prepare("DELETE FROM progress WHERE user_id=?").run(account.id);
      db.prepare("DELETE FROM analytics_events WHERE learner_id=?").run(
        account.id,
      );
      db.prepare("DELETE FROM feedback_responses WHERE learner_id=?").run(
        account.id,
      );
      db.prepare("UPDATE users SET profile=? WHERE id=?").run(
        JSON.stringify({ displayName: "", reviewReminders: true }),
        account.id,
      );
    } else if (body.action === "profile") {
      db.prepare("UPDATE users SET profile=? WHERE id=?").run(
        JSON.stringify(profileSchema.parse(body.profile)),
        account.id,
      );
    } else if (body.action === "progress") {
      const input = z
        .object({
          lessonId: z.string(),
          value: z.string().max(1500000),
          revision: z.number().int().nonnegative(),
        })
        .parse(body);
      const lesson = lessons.find((l) => l.lessonId === input.lessonId);
      if (!lesson) return response({ error: "Unknown lesson." }, 404);
      decodeProgress(lesson, input.value);
      const result =
        input.revision === 0
          ? db
              .prepare("INSERT OR IGNORE INTO progress VALUES (?, ?, ?, 1)")
              .run(account.id, input.lessonId, input.value)
          : db
              .prepare(
                "UPDATE progress SET value=?, revision=revision+1 WHERE user_id=? AND lesson_id=? AND revision=?",
              )
              .run(input.value, account.id, input.lessonId, input.revision);
      if (!result.changes)
        return response(
          {
            error: "Progress changed in another tab. Reload before continuing.",
          },
          409,
        );
      return response({ revision: input.revision + 1 });
    } else return response({ error: "Unknown action." }, 400);
    return response({ ok: true });
  } catch {
    return response(
      { error: "Unable to save. Check your input and try again." },
      400,
    );
  }
}
