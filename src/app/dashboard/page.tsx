import { lessons } from "@/lib/content";
import { Dashboard } from "@/components/dashboard";

export default function DashboardPage() {
  return <Dashboard lessons={lessons} />;
}
