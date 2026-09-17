"use client";
import { useState } from "react";
import { accountAction } from "@/lib/account-client";
export function AccountForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="dashboard-section">
      <h2>Keep learning across devices</h2>
      <p>
        Create an account or sign in. Guest progress stays separate on this
        browser. Use a unique password of at least 12 characters. Keep it safe:
        password recovery is not available yet.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          const data = new FormData(event.currentTarget);
          const action =
            (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
              "value",
            ) || "login";
          try {
            await accountAction({
              action,
              username: data.get("username"),
              password: data.get("password"),
            });
            window.location.reload();
          } catch (error) {
            setMessage((error as Error).message);
            setBusy(false);
          }
        }}
      >
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            required
            pattern="[a-zA-Z0-9_-]{3,40}"
            minLength={3}
            maxLength={40}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={12}
            maxLength={128}
          />
        </label>
        <button className="button" value="login" disabled={busy}>
          Sign in
        </button>{" "}
        <button className="text-button" value="register" disabled={busy}>
          Create account
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
