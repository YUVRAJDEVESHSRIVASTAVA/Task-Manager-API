import type { AuditAction } from "./constants";
import { prisma } from "./prisma";

export type AuditInput = {
  action: AuditAction;
  message: string;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      message: input.message,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
