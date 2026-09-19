import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

export function openStore(
  path = process.env.CINEMATH_DB_PATH || resolve("data/cinemath.sqlite"),
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, profile TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL, value TEXT NOT NULL, revision INTEGER NOT NULL, PRIMARY KEY(user_id, lesson_id));
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_feedback_log (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      lesson_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      problem_version INTEGER NOT NULL,
      account_id TEXT,
      category TEXT NOT NULL,
      confidence REAL NOT NULL,
      model_version TEXT NOT NULL,
      fallback INTEGER NOT NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      reviewed INTEGER NOT NULL DEFAULT 0
    );`);
  return db;
}
let shared: DatabaseSync | undefined;
export const store = () => (shared ??= openStore());
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, expected] = hash.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(expected, "hex"),
  );
}
// Generic fixed-window limiter shared by login attempts and AI usage caps.
export function rateLimit(
  db: DatabaseSync,
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
) {
  db.prepare("DELETE FROM limits WHERE expires < ?").run(now);
  db.prepare(
    "INSERT INTO limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + windowMs);
  return (
    Number(
      db.prepare("SELECT count FROM limits WHERE key=?").get(key)!.count,
    ) <= max
  );
}
export function allowLogin(db: DatabaseSync, key: string, now = Date.now()) {
  return rateLimit(db, `login:${key}`, 10, 900000, now);
}
// docs/grading-policy.md: AI usage limits and cost monitoring. A small,
// tunable per-identity daily cap on proof-feedback requests.
export const AI_FEEDBACK_DAILY_LIMIT = 20;
export function allowAiFeedback(
  db: DatabaseSync,
  key: string,
  now = Date.now(),
) {
  return rateLimit(db, `ai:${key}`, AI_FEEDBACK_DAILY_LIMIT, 86400000, now);
}
