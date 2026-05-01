export const userRoles = ["USER", "ADMIN"] as const;
export type UserRole = (typeof userRoles)[number];

export const taskStatuses = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export const auditActions = [
  "USER_REGISTERED",
  "USER_LOGGED_IN",
  "USER_LOGGED_OUT",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
  "ADMIN_SEEDED",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const SESSION_COOKIE_NAME = "tm_session";
export const SESSION_DURATION_DAYS = 14;

export const roleMeta: Record<UserRole, { label: string; className: string }> = {
  USER: { label: "User", className: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-700" },
  ADMIN: { label: "Admin", className: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/50" },
};

export const taskStatusMeta: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-700" },
  IN_PROGRESS: { label: "In progress", className: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-900/50" },
  BLOCKED: { label: "Blocked", className: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-900/50" },
  DONE: { label: "Done", className: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/50" },
};

export const taskPriorityMeta: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/50" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/50" },
  HIGH: { label: "High", className: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-900/50" },
};

export const auditActionMeta: Record<AuditAction, { label: string; className: string }> = {
  USER_REGISTERED: { label: "Registered", className: "bg-cyan-50 text-cyan-800 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-100 dark:ring-cyan-900/50" },
  USER_LOGGED_IN: { label: "Logged in", className: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/50" },
  USER_LOGGED_OUT: { label: "Logged out", className: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-700" },
  TASK_CREATED: { label: "Task created", className: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-900/50" },
  TASK_UPDATED: { label: "Task updated", className: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/50" },
  TASK_DELETED: { label: "Task deleted", className: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-900/50" },
  ADMIN_SEEDED: { label: "Seeded admin", className: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-900/50" },
};
