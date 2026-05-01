"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleMeta, taskPriorityMeta, taskStatusMeta } from "@/lib/constants";

type AuthMode = "login" | "register";

function resolveRedirect(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/dashboard";
  }

  return nextPath;
}

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : "Could not complete authentication.";
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveRedirect(searchParams.get("next"));
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "register" && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(
          mode === "register"
            ? {
                name,
                email,
                password,
              }
            : {
                email,
                password,
              },
        ),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Authentication failed.");
      }

      setMessage({
        type: "success",
        text: mode === "register" ? "Account created successfully." : "Signed in successfully.",
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: friendlyError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
      <aside className="surface-panel rounded-[2rem] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Access control</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Sign in, create an account, and start managing work.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          The app stores users, sessions, tasks, and audit events in one database so the admin can always see what happened.
        </p>

        <div className="mt-8 space-y-4">
          {[
            {
              title: "Session visibility",
              text: "Logins and logouts are stored so the admin dashboard can show activity history.",
            },
            {
              title: "Task intelligence",
              text: "Tasks support status, priority, and deadlines with overdue highlighting.",
            },
            {
              title: "Role-aware access",
              text: "Only admin users can open the admin dashboard and review the audit trail.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-medium text-slate-300">What the admin sees</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-200">
            <p>Registered users, active sessions, and login/logout timeline</p>
            <p>Task creation, updates, deletions, and overdue counts</p>
            <p>Role badges for users and the current admin account</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl p-4 ring-1 ${roleMeta.ADMIN.className}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Admin role</p>
            <p className="mt-2 text-lg font-semibold">Full visibility</p>
          </div>
          <div className={`rounded-2xl p-4 ring-1 ${taskStatusMeta.DONE.className}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Tasks</p>
            <p className="mt-2 text-lg font-semibold">Deadline aware</p>
          </div>
          <div className={`rounded-2xl p-4 ring-1 ${taskPriorityMeta.HIGH.className}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Priority</p>
            <p className="mt-2 text-lg font-semibold">Focus important work</p>
          </div>
        </div>
      </aside>

      <section className="surface-panel rounded-[2rem] p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Get started</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                  setConfirmPassword("");
                }}
                className={`rounded-full px-4 py-2 transition ${mode === "login" ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setMessage(null);
                  setConfirmPassword("");
                }}
                className={`rounded-full px-4 py-2 transition ${mode === "register" ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>

          {mode === "register" && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Confirm password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                required
              />
            </label>
          )}

          {message && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${message.type === "error" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-sm leading-6 text-slate-500">
            {mode === "login" ? "Need an account? Switch to register." : "Already have an account? Switch to login."}
          </p>
        </form>
      </section>
    </div>
  );
}