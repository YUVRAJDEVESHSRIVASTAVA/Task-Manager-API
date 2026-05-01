import type { AuditLog, Session, Task, User } from "@prisma/client";
import type {
  SerializedAuditLog,
  SerializedSession,
  SerializedTask,
  SerializedUser,
} from "./types";

type UserRecord = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "role"
  | "createdAt"
  | "updatedAt"
  | "lastLoginAt"
  | "lastLogoutAt"
>;

export function serializeUser(user: UserRecord): SerializedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    lastLogoutAt: user.lastLogoutAt ? user.lastLogoutAt.toISOString() : null,
  };
}

export function serializeTask(task: Task): SerializedTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    userId: task.userId,
  };
}

export function serializeSession(
  session: Session & { user: UserRecord },
): SerializedSession {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
    lastSeenAt: session.lastSeenAt.toISOString(),
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    user: serializeUser(session.user),
  };
}

export function serializeAuditLog(
  log: AuditLog & { user?: UserRecord | null },
): SerializedAuditLog {
  return {
    id: log.id,
    action: log.action,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        }
      : null,
    sessionId: log.sessionId,
  };
}
