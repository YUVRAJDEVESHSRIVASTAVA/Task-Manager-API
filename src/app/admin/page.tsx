import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin-client";
import { getCurrentAuthContext } from "@/lib/session";
import { getAdminOverview } from "@/lib/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await getCurrentAuthContext();

  if (!auth) {
    redirect("/auth?next=/admin");
  }

  if (auth.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const overview = await getAdminOverview();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminClient initialOverview={overview} />
    </main>
  );
}