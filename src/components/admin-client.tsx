"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { auditActionMeta, auditActions, roleMeta } from "@/lib/constants";
import { formatDateOnly, formatDateTime } from "@/lib/dates";
import type { AdminOverview } from "@/lib/types";

type AdminClientProps = {
  initialOverview: AdminOverview;
};

type OverviewApiResponse = {
  ok: boolean;
  overview?: AdminOverview;
  error?: string;
};

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : "Could not complete the request.";
}

export function AdminClient({ initialOverview }: AdminClientProps) {
  const router = useRouter();
  const [overview, setOverview] = useState(initialOverview);
  const [search, setSearch] = useState("");
  const [logFilter, setLogFilter] = useState<(typeof auditActions)[number] | "ALL">("ALL");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function refreshOverview() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/overview", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/auth?next=/admin");
        return false;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return false;
      }

      const payload = (await response.json()) as OverviewApiResponse;
      const nextOverview = payload.overview;

      if (!response.ok || !nextOverview) {
        throw new Error(payload.error ?? "Could not refresh admin overview.");
      }

      startTransition(() => {
        setOverview(nextOverview);
      });

      return true;
    } catch (error) {
      setNotice({
        type: "error",
        text: friendlyError(error),
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  }

  const filteredUsers = overview.users.filter((user) => {
    const haystack = `${user.name} ${user.email}`.toLowerCase();
    return !deferredSearch || haystack.includes(deferredSearch);
  });

  const filteredActivity = overview.activity.filter((entry) => {
    const haystack = `${entry.message} ${entry.user?.name ?? ""} ${entry.user?.email ?? ""}`.toLowerCase();
    const matchesSearch = !deferredSearch || haystack.includes(deferredSearch);
    const matchesFilter = logFilter === "ALL" || entry.action === logFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-8">
      <header className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              User activity and audit trail
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review who registered, signed in, signed out, and what the system is doing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <ThemeToggle />
            <button
              onClick={() => {
                void refreshOverview();
              }}
              disabled={isRefreshing || isPending}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-60"
            >
              {isRefreshing || isPending ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                void signOut();
              }}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 transition hover:bg-rose-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium ${notice.type === "error" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-inherit opacity-80 transition hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { label: "Users", value: overview.summary.userCount },
          { label: "Active sessions", value: overview.summary.activeSessionCount },
          { label: "Tasks", value: overview.summary.taskCount },
          { label: "Overdue tasks", value: overview.summary.overdueTaskCount },
          { label: "Logins 24h", value: overview.summary.loginCount24h },
          { label: "New users 24h", value: overview.summary.newUsers24h },
        ].map((item) => (
          <article key={item.label} className="surface-card rounded-3xl p-5">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="surface-panel rounded-[2rem] p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Search</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Find users and activity quickly
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 sm:w-80"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
            />
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 sm:w-56"
              value={logFilter}
              onChange={(event) => setLogFilter(event.target.value as (typeof auditActions)[number] | "ALL")}
            >
              <option value="ALL">All activity</option>
              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {auditActionMeta[action].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Users</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Registered accounts and session usage
            </h2>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">User</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Role</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Tasks</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Active sessions</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Last login</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Last logout</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="align-top transition hover:bg-slate-50/80">
                    <td className="border-b border-slate-100 px-4 py-4">
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleMeta[user.role].className}`}>
                        {roleMeta[user.role].label}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-700">{user.taskCount}</td>
                    <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-700">{user.activeSessionCount}</td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{formatDateOnly(user.lastLoginAt)}</td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{formatDateOnly(user.lastLogoutAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Activity</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Recent login, logout, and task events
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {filteredActivity.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
                No matching activity entries.
              </div>
            ) : (
              filteredActivity.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${auditActionMeta[entry.action].className}`}>
                      {auditActionMeta[entry.action].label}
                    </span>
                    {entry.user && (
                      <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                        {entry.user.name} - {entry.user.email}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{entry.message}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{formatDateTime(entry.createdAt)}</span>
                    {entry.ipAddress && <span>{entry.ipAddress}</span>}
                    {entry.sessionId && <span>Session: {entry.sessionId.slice(0, 8)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="surface-panel rounded-[2rem] p-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Active sessions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Users currently signed in</h2>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {overview.sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
              No active sessions right now.
            </div>
          ) : (
            overview.sessions.map((session) => (
              <article key={session.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{session.user.name}</p>
                    <p className="text-sm text-slate-500">{session.user.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleMeta[session.user.role].className}`}>
                    {roleMeta[session.user.role].label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Last seen</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(session.lastSeenAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Expires</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(session.expiresAt)}</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">{session.ipAddress ?? "IP not captured"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}