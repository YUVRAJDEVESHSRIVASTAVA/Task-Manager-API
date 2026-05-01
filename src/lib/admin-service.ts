import { prisma } from "./prisma";
import { serializeAuditLog, serializeSession, serializeUser } from "./serializers";
import type { AdminOverview } from "./types";

export async function getAdminOverview(): Promise<AdminOverview> {
  const now = new Date();
  const since24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [users, activeSessions, activity, taskCount, overdueTaskCount, loginCount24h, logoutCount24h, newUsers24h] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              tasks: true,
              sessions: true,
            },
          },
        },
      }),
      prisma.session.findMany({
        where: {
          revokedAt: null,
          expiresAt: { gt: now },
        },
        include: {
          user: true,
        },
        orderBy: { lastSeenAt: "desc" },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          user: true,
        },
      }),
      prisma.task.count(),
      prisma.task.count({
        where: {
          deadline: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: "USER_LOGGED_IN",
          createdAt: { gte: since24Hours },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: "USER_LOGGED_OUT",
          createdAt: { gte: since24Hours },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: since24Hours },
        },
      }),
    ]);

  const activeSessionCounts = activeSessions.reduce((map, session) => {
    map.set(session.userId, (map.get(session.userId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return {
    summary: {
      userCount: users.length,
      activeSessionCount: activeSessions.length,
      taskCount,
      overdueTaskCount,
      loginCount24h,
      logoutCount24h,
      newUsers24h,
    },
    users: users.map((user) => ({
      ...serializeUser(user),
      taskCount: user._count.tasks,
      sessionCount: user._count.sessions,
      activeSessionCount: activeSessionCounts.get(user.id) ?? 0,
    })),
    sessions: activeSessions.map(serializeSession),
    activity: activity.map(serializeAuditLog),
  };
}
