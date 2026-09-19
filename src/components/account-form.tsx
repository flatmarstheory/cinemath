"use client";
import { useState } from "react";
import { accountAction } from "@/lib/account-client";

export function AccountForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const registering = mode === "register";

  return (
    <section className="account-card" aria-labelledby="account-heading">
      <div className="account-story">
        <p className="eyebrow">YOUR SPACE TO THINK</p>
        <h2>
          A little progress.
          <br />
          <em>A lasting understanding.</em>
        </h2>
        <p>
          Keep the ideas you’ve worked for. Pick up where you left off, wherever
          you learn next.
        </p>
        <div className="account-illustration" aria-hidden="true">
          <span className="account-axis" />
          <span className="account-vector vector-a" />
          <span className="account-vector vector-b" />
          <span className="account-vector vector-c" />
          <span className="account-art-label">
            SMALL STEPS. NEW DIRECTIONS.
          </span>
        </div>
        <ul className="account-benefits">
          <li>Save your place across devices</li>
          <li>Revisit the concepts that need practice</li>
          <li>See your understanding take shape</li>
        </ul>
      </div>
      <div className="account-panel">
        <div className="account-modes" aria-label="Account access">
          <button
            type="button"
            aria-pressed={!registering}
            disabled={busy}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={registering}
            disabled={busy}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
          >
            Create account
          </button>
        </div>
        <p className="eyebrow">
          {registering ? "BEGIN YOUR NEXT CHAPTER" : "GOOD TO HAVE YOU BACK"}
        </p>
        <h2 id="account-heading">
          {registering ? "Make room for discovery." : "Welcome back."}
        </h2>
        <p className="muted">
          {registering
            ? "A username, a password, and room to grow. No email needed."
            : "Your next moment of clarity is waiting."}
        </p>
        <form
          className="account-form"
          aria-busy={busy}
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            const data = new FormData(event.currentTarget);
            try {
              await accountAction({
                action: mode,
                username: data.get("username"),
                password: data.get("password"),
              });
              window.location.reload();
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Something went wrong. Please try again.",
              );
              setBusy(false);
            }
          }}
        >
          <div className="account-field">
            <label htmlFor="account-username">Username</label>
            <input
              id="account-username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              pattern={"[a-zA-Z0-9_\\-]{3,40}"}
              minLength={3}
              maxLength={40}
              aria-describedby={registering ? "username-help" : undefined}
              disabled={busy}
              placeholder="Your username"
            />
            {registering && (
              <small id="username-help">
                3–40 letters, numbers, underscores, or hyphens.
              </small>
            )}
          </div>
          <div className="account-field">
            <label htmlFor="account-password">Password</label>
            <div className="account-password">
              <input
                id="account-password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={registering ? "new-password" : "current-password"}
                required
                minLength={12}
                maxLength={128}
                aria-describedby={registering ? "password-help" : undefined}
                disabled={busy}
                placeholder={
                  registering ? "At least 12 characters" : "Your password"
                }
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>
            {registering && (
              <small id="password-help">
                Use a unique password, 12–128 characters. Keep it safe: password
                recovery isn’t available yet.
              </small>
            )}
          </div>
          <p className="account-error" role="status" aria-live="polite">
            {message}
          </p>
          <button
            className="button account-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "One moment…"
              : registering
                ? "Create my account"
                : "Sign in to continue"}
            <span aria-hidden="true"> →</span>
          </button>
        </form>
        <p className="account-guest">
          Just exploring? You can keep practicing as a guest. Guest progress
          stays separate in this browser.
        </p>
      </div>
    </section>
  );
}
