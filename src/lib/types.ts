import type { AuditAction, TaskPriority, TaskStatus, UserRole } from "./constants";

export type SerializedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
};

export type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type SerializedSession = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: SerializedUser;
};

export type SerializedAuditLog = {
  id: string;
  action: AuditAction;
  message: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: Pick<SerializedUser, "id" | "name" | "email" | "role"> | null;
  sessionId: string | null;
};

export type DashboardSummary = {
  total: number;
  done: number;
  inProgress: number;
  backlog: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  statusBreakdown: Record<TaskStatus, number>;
  recentActivity: SerializedAuditLog[];
};

export type DashboardSnapshot = {
  user: SerializedUser;
  tasks: SerializedTask[];
  summary: DashboardSummary;
};

export type AdminUserSummary = SerializedUser & {
  taskCount: number;
  sessionCount: number;
  activeSessionCount: number;
};

export type AdminOverview = {
  summary: {
    userCount: number;
    activeSessionCount: number;
    taskCount: number;
    overdueTaskCount: number;
    loginCount24h: number;
    logoutCount24h: number;
    newUsers24h: number;
  };
  users: AdminUserSummary[];
  sessions: SerializedSession[];
  activity: SerializedAuditLog[];
};
