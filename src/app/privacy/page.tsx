import Link from "next/link";
export default function PrivacyPage() {
  return (
    <main id="main" className="dashboard-page">
      <h1>Your learning data</h1>
      <p>
        Guest progress and settings stay in this browser until you delete them
        or clear browser storage. Guest work is separate from account work and
        is not uploaded when you sign in.
      </p>
      <p>
        When you create an account, CineMath stores your username, a salted
        password hash, profile settings, and learning records on its server.
        Learning records include drafts, answers, timestamps, hints, solution
        reveals, lesson position, and the content version. Concept mastery is
        calculated from these records. We do not collect an email address or
        send review emails.
      </p>
      <p>
        We use an HTTP-only session cookie to keep you signed in for up to 30
        days. Signing out revokes that session. Authentication attempt counts
        expire after 15 minutes. No third-party analytics service receives
        learning data.
      </p>
      <p>
        Records remain until you choose to delete them. On your dashboard you
        can view progress, mastery, and review suggestions, download your data
        including individual attempts, delete learning data and profile settings
        while keeping your login, or permanently delete your account. Account
        deletion removes your records and revokes all sessions immediately.
        Browser guest data is separate and can be deleted while signed out.
      </p>
      <p>
        The application does not create backup copies. Operators who back up the
        database must publish their backup retention period before a public
        deployment. There is currently no password recovery; choose and securely
        retain a unique password.
      </p>
      <Link href="/dashboard">Manage my data</Link>
    </main>
  );
}
