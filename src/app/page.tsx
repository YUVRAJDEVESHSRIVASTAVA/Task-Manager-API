import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentAuthContext } from "@/lib/session";
import { roleMeta, taskPriorityMeta, taskStatusMeta } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await getCurrentAuthContext();
  const currentLabel = auth ? roleMeta[auth.user.role].label : "Guest";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="surface-panel flex items-center justify-between rounded-full px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white shadow-md shadow-teal-500/20">
            TM
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">
              Task Manager API
            </p>
            <p className="text-sm text-slate-500">
              Deadline-aware task tracking with audit logging
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
          <ThemeToggle />
          <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-slate-900 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin" className="rounded-full px-4 py-2 transition hover:bg-slate-900 hover:text-white">
            Admin
          </Link>
          <Link
            href={auth ? "/dashboard" : "/auth"}
            className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-teal-700"
          >
            {auth ? "Open app" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <span className="reveal inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              Secure tasks, clean APIs, visible activity
            </span>
            <div className="space-y-4 reveal reveal-delay-1">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Manage tasks, deadlines, users, and admin audit history from one workspace.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Users can register, sign in, and manage tasks with deadlines and priorities. The admin can review who created an account, who logged in, who logged out, and what sessions are active.
              </p>
            </div>
          </div>

          <div className="reveal reveal-delay-2 flex flex-wrap gap-3">
            <Link
              href={auth ? "/dashboard" : "/auth"}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
            >
              {auth ? "Go to dashboard" : "Create account or sign in"}
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800"
            >
              Admin area
            </Link>
          </div>

          <div className="reveal reveal-delay-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="surface-card rounded-3xl p-5">
              <p className="text-sm font-medium text-slate-500">Authentication</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">Login and registration</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Hashed passwords, secure sessions, and role-based access.</p>
            </article>
            <article className="surface-card rounded-3xl p-5">
              <p className="text-sm font-medium text-slate-500">Tasks</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">Status and deadlines</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Todo, in-progress, blocked, and done states with due dates.</p>
            </article>
            <article className="surface-card rounded-3xl p-5">
              <p className="text-sm font-medium text-slate-500">Admin</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">Activity visibility</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">See registration, login, logout, and active session history.</p>
            </article>
            <article className="surface-card rounded-3xl p-5">
              <p className="text-sm font-medium text-slate-500">Current mode</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{currentLabel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {auth ? `Welcome back, ${auth.user.name}.` : "Use the auth page to enter the app."}
              </p>
            </article>
          </div>
        </div>

        <aside className="hero-rings surface-panel relative overflow-hidden rounded-[2rem] p-6 shadow-2xl shadow-teal-900/5">
          <div className="relative space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Built so it is easy to use and easy to explain
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "1. Authentication",
                  text: "Users register or sign in. The app hashes passwords, creates a session, and stores a secure cookie.",
                },
                {
                  title: "2. Task flow",
                  text: "Authenticated users create, update, and delete tasks with priorities and deadlines.",
                },
                {
                  title: "3. Admin review",
                  text: "Admin users see users, sessions, login/logout activity, and audit history in one place.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/20">
              <p className="text-sm font-medium text-slate-300">Local admin account</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-200">
                <p>Email: admin@taskmanager.local</p>
                <p>Password: Admin123!</p>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Change these values in your .env file before using the app outside local development.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl p-4 ring-1 ${taskStatusMeta.DONE.className}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Tasks</p>
                <p className="mt-2 text-lg font-semibold">Deadline aware</p>
              </div>
              <div className={`rounded-2xl p-4 ring-1 ${taskPriorityMeta.HIGH.className}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Priority</p>
                <p className="mt-2 text-lg font-semibold">Focus important work</p>
              </div>
              <div className={`rounded-2xl p-4 ring-1 ${roleMeta.ADMIN.className}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Admin</p>
                <p className="mt-2 text-lg font-semibold">Visibility for every session</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white/80">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">UI</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Responsive and user friendly</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
