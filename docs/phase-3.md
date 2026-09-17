# Phase 3: accounts, progress, and mastery

## Running and deploying

Use Node 24 (CI uses 24), `npm ci`, `npm run build`, then `npm start`. The Node runtime uses built-in SQLite, with foreign keys, WAL and atomic revision-checked writes. The default database is `data/cinemath.sqlite`, ignored by Git. Set `CINEMATH_DB_PATH` to an absolute file on a persistent disk in production. Deploy one Node application instance backed by that disk; ephemeral/serverless filesystems and multiple independent replicas are not supported. Configure HTTPS and preserve the public Host header so same-origin checks and secure cookies work. No external auth provider or credentials are required.

Back up the database using SQLite-aware tooling, restrict disk access to the app operator, and publish any backup retention period before a public release. The application creates no backups. Do not publish a deployment on ephemeral storage as persistent account hosting.

## Accounts and privacy

Usernames are case insensitive, 3–40 ASCII letters, numbers, underscores or hyphens. Passwords are 12–128 characters, salted with 16 random bytes and hashed with scrypt. There is no email collection or recovery workflow. A cryptographically random session token is stored only as a SHA-256 hash in SQLite; its browser cookie is HTTP-only, SameSite=Lax and Secure on HTTPS. Sessions expire in 30 days and are revoked on sign-out or account deletion. Authentication is limited to 10 attempts per username per 15 minutes. All writes require the request Origin to match and authenticated mutations require the expected account ID, preventing cross-account stale-tab writes. Responses are not cached.

Guest work remains local and is deliberately separate from account data; sign-in does not silently upload a shared browser's work. Preview mode never loads or writes learner data. The dashboard provides profile settings, review visibility, full JSON export, learning-data deletion and account deletion. Foreign-key cascades remove progress and sessions with an account. See `/privacy` for the learner-facing policy.

## Persistence and concurrency

Account lesson records hold the full versioned content snapshot, draft answers, attempts, support usage, exact lesson stage/index and separate review attempts. Course completion is derived from lesson completion. Every action queues an ordered save; the server validates the snapshot, grading and progress invariants. An optimistic revision guard rejects stale writes with 409 instead of losing newer work. A failed save leaves work visible, stops further writes and tells the learner to keep the tab open and reload to reconnect. Wait for “Progress saved to your account” before closing. Local guest persistence remains synchronous.

Older content snapshots remain exportable; mismatched versions are not used to grade current content. Starting current content replaces that lesson's incompatible account save after a recovery notice. Historical versions should be exported before continuing if needed.

## Mastery model v1

Start each concept at zero. Replay all its lesson and targeted-review attempts in timestamp order across the course. Equal timestamps are ordered by lesson ID, problem ID and attempt index. Each event applies:

`m = clamp(m + 0.12 * (difficulty / 5) * q - 0.03 * (hintsUsed / 3), 0, 1)`

`q` is +1 for correct work, -1 for incorrect work, and 0 after a solution reveal. Difficulty is authored from 1–5. Each attempt includes the cumulative hints already shown on that problem (0–3). Thus support costs apply on each submitted attempt, not on merely opening a hint. Invalid submissions contribute nothing. No time decay or probabilistic claims are made. Model constants live in `src/lib/mastery.ts`; records are derived from persisted evidence to avoid duplicate or drifting aggregates.

For example, an unassisted correct difficulty-3 attempt adds 0.072. With two hints it adds 0.052. An incorrect difficulty-3 attempt subtracts 0.072 before clamping. Work after viewing a solution cannot increase mastery. A correct submission is locked against duplicates in the current practice run. A deliberately started fresh review run may add new evidence.

The queue suggests one relevant lesson per tracked concept below 0.6, weakest first. It links directly to fresh problems tagged with that concept. Review evidence does not reset lesson completion or the original resume point. The profile setting hides/shows suggestions only; it does not schedule notifications.

## Verification

Unit tests cover chronological replay, exact coefficients, clamping, solution support and review evidence. Account API tests cover authentication, session isolation, server validation, revision conflicts, exports and deletion. Browser tests cover account creation, cross-browser resume, profile persistence and fresh review. Existing guest, preview, accessibility and lesson interaction suites remain required.
