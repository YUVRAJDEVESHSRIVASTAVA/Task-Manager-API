import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { getCurrentAuthContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const auth = await getCurrentAuthContext();

  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <AuthPanel />
    </main>
  );
}