"use client";

import { useDeferredValue, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleMeta, taskPriorityMeta, taskPriorities, taskStatusMeta, taskStatuses, type TaskPriority, type TaskStatus } from "@/lib/constants";
import { formatDateOnly, formatDateTime, isDueToday, isOverdue, toDateTimeLocalValue } from "@/lib/dates";
import type { DashboardSnapshot, SerializedTask } from "@/lib/types";

type TaskFormState = {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
};

const emptyForm: TaskFormState = {
  title: "",
  description: "",
  deadline: "",
  status: "TODO",
  priority: "MEDIUM",
};

type DashboardClientProps = {
  initialSnapshot: DashboardSnapshot;
};

type SnapshotApiResponse = {
  ok: boolean;
  snapshot?: DashboardSnapshot;
  error?: string;
};

function toIsoOrEmpty(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : "Could not complete the request.";
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DashboardClient({ initialSnapshot }: DashboardClientProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TaskPriority>("ALL");
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function loadSnapshot() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/tasks", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/auth?next=/dashboard");
        return false;
      }

      const payload = (await response.json()) as SnapshotApiResponse;
      const nextSnapshot = payload.snapshot;

      if (!response.ok || !nextSnapshot) {
        throw new Error(payload.error ?? "Could not refresh tasks.");
      }

      startTransition(() => {
        setSnapshot(nextSnapshot);
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

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch(editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks", {
        method: editingTask ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          deadline: toIsoOrEmpty(form.deadline),
        }),
      });

      if (response.status === 401) {
        router.replace("/auth?next=/dashboard");
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save the task.");
      }

      const loaded = await loadSnapshot();
      if (!loaded) {
        return;
      }

      setEditingTask(null);
      setForm(emptyForm);
      setNotice({
        type: "success",
        text: editingTask ? "Task updated." : "Task created.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: friendlyError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function quickUpdate(task: SerializedTask, status: TaskStatus) {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        router.replace("/auth?next=/dashboard");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not update the task.");
      }

      const loaded = await loadSnapshot();
      if (!loaded) {
        return;
      }

      setNotice({
        type: "success",
        text: `Task "${task.title}" updated.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: friendlyError(error),
      });
    }
  }

  async function removeTask(task: SerializedTask) {
    const shouldDelete = window.confirm(`Delete the task "${task.title}"?`);

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/auth?next=/dashboard");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not delete the task.");
      }

      const loaded = await loadSnapshot();
      if (!loaded) {
        return;
      }

      setNotice({
        type: "success",
        text: `Task "${task.title}" deleted.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: friendlyError(error),
      });
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

  const filteredTasks = snapshot.tasks.filter((task) => {
    const matchesSearch =
      !deferredSearch ||
      task.title.toLowerCase().includes(deferredSearch) ||
      (task.description ?? "").toLowerCase().includes(deferredSearch);
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const summary = snapshot.summary;
  const statusEntries = Object.entries(summary.statusBreakdown) as [TaskStatus, number][];

  return (
    <div className="space-y-8 pb-8">
      <header className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Hello, {snapshot.user.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{snapshot.user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <ThemeToggle />
            <span className={`rounded-full px-4 py-2 ring-1 ${roleMeta[snapshot.user.role].className}`}>
              {roleMeta[snapshot.user.role].label}
            </span>
            {snapshot.user.role === "ADMIN" && (
              <Link href="/admin" className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-teal-700">
                Admin view
              </Link>
            )}
            <button
              onClick={() => {
                void loadSnapshot();
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total tasks", value: summary.total },
          { label: "Done", value: summary.done },
          { label: "Overdue", value: summary.overdue },
          { label: "Due today", value: summary.dueToday },
        ].map((item) => (
          <article key={item.label} className="surface-card rounded-3xl p-5">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Task composer</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {editingTask ? `Editing ${editingTask.title}` : "Create a new task"}
              </h2>
            </div>
            {editingTask && (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setForm(emptyForm);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form className="mt-6 space-y-4" onSubmit={saveTask}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Write the task title"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add context, notes, or next steps"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Deadline</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
                >
                  {taskPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {taskPriorityMeta[priority].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusMeta[status].label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editingTask ? "Update task" : "Add task"}
            </button>
          </form>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Filters</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Find the right task quickly</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task title or description"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | TaskStatus)}
              >
                <option value="ALL">All statuses</option>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusMeta[status].label}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as "ALL" | TaskPriority)}
              >
                <option value="ALL">All priorities</option>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {taskPriorityMeta[priority].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statusEntries.map(([status, count]) => (
                <div key={status} className={`rounded-2xl p-4 ring-1 ${taskStatusMeta[status].className}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-75">
                    {taskStatusMeta[status].label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{count}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-medium text-slate-300">Recent activity</p>
              <div className="mt-4 space-y-3">
                {summary.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-400">No recent activity yet.</p>
                ) : (
                  summary.recentActivity.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">{entry.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatShortDate(entry.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-panel rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Task board</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Tasks that match your filters</h2>
            <p className="mt-2 text-sm text-slate-500">{filteredTasks.length} task(s) currently visible.</p>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
            No tasks match your current filters.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.deadline, task.status);
              const dueToday = isDueToday(task.deadline, task.status);

              return (
                <article
                  key={task.id}
                  className={`rounded-3xl border bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 ${overdue ? "border-rose-200" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${taskStatusMeta[task.status].className}`}>
                          {taskStatusMeta[task.status].label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${taskPriorityMeta[task.priority].className}`}>
                          {taskPriorityMeta[task.priority].label}
                        </span>
                        {overdue && (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                            Overdue
                          </span>
                        )}
                        {!overdue && dueToday && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Due today
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-950">{task.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{task.description || "No description added yet."}</p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <p>Updated</p>
                      <p className="mt-1 font-medium text-slate-700">{formatDateOnly(task.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Deadline</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(task.deadline)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Completed</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {task.completedAt ? formatDateTime(task.completedAt) : "Not completed"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {task.status !== "DONE" && (
                      <button
                        type="button"
                        onClick={() => {
                          void quickUpdate(task, "DONE");
                        }}
                        className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                      >
                        Mark done
                      </button>
                    )}
                    {task.status !== "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() => {
                          void quickUpdate(task, "IN_PROGRESS");
                        }}
                        className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
                      >
                        In progress
                      </button>
                    )}
                    {task.status !== "TODO" && (
                      <button
                        type="button"
                        onClick={() => {
                          void quickUpdate(task, "TODO");
                        }}
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      >
                        Reset to todo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(task);
                        setForm({
                          title: task.title,
                          description: task.description ?? "",
                          deadline: toDateTimeLocalValue(task.deadline),
                          status: task.status,
                          priority: task.priority,
                        });
                      }}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void removeTask(task);
                      }}
                      className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}