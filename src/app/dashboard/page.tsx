import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentAuthContext } from "@/lib/session";
import { getDashboardSnapshot } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getCurrentAuthContext();

  if (!auth) {
    redirect("/auth?next=/dashboard");
  }

  const snapshot = await getDashboardSnapshot(auth.user.id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardClient initialSnapshot={snapshot} />
    </main>
  );
}