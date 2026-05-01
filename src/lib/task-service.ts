import { prisma } from "./prisma";
import { badRequest, notFound } from "./errors";
import { isDueToday, isOverdue, parseIsoDate } from "./dates";
import { recordAuditLog } from "./audit";
import { serializeAuditLog, serializeTask, serializeUser } from "./serializers";
import type { AuthContext } from "./session";
import type { DashboardSnapshot, SerializedTask } from "./types";
import type { TaskPriority, TaskStatus } from "./constants";

type TaskInput = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | null;
};

type TaskPatchInput = Partial<TaskInput>;

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getTaskOrThrow(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw notFound("Task not found.");
  }

  return task;
}

function summarizeTasks(tasks: SerializedTask[]) {
  const statusBreakdown: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    DONE: 0,
  };

  for (const task of tasks) {
    statusBreakdown[task.status] += 1;
  }

  return {
    total: tasks.length,
    done: statusBreakdown.DONE,
    inProgress: statusBreakdown.IN_PROGRESS,
    backlog: statusBreakdown.TODO,
    blocked: statusBreakdown.BLOCKED,
    overdue: tasks.filter((task) => isOverdue(task.deadline, task.status)).length,
    dueToday: tasks.filter((task) => isDueToday(task.deadline, task.status)).length,
    statusBreakdown,
  };
}

export async function getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
  const [user, tasks, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.task.findMany({
      where: { userId },
      orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: true },
    }),
  ]);

  if (!user) {
    throw notFound("User not found.");
  }

  const serializedTasks = tasks.map(serializeTask);
  const summary = summarizeTasks(serializedTasks);

  return {
    user: serializeUser(user),
    tasks: serializedTasks,
    summary: {
      ...summary,
      recentActivity: activity.map(serializeAuditLog),
    },
  };
}

export async function createTask(auth: AuthContext, input: TaskInput) {
  const deadline = parseIsoDate(input.deadline);

  if (input.deadline && !deadline) {
    throw badRequest("Deadline must be a valid ISO date.");
  }

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: normalizeText(input.description),
      status: input.status,
      priority: input.priority,
      deadline,
      completedAt: input.status === "DONE" ? new Date() : null,
      userId: auth.user.id,
    },
  });

  await recordAuditLog({
    action: "TASK_CREATED",
    message: `Created task "${task.title}"`,
    userId: auth.user.id,
    sessionId: auth.session.id,
    ipAddress: auth.session.ipAddress,
    userAgent: auth.session.userAgent,
  });

  return serializeTask(task);
}

export async function updateTask(auth: AuthContext, taskId: string, input: TaskPatchInput) {
  const currentTask = await getTaskOrThrow(taskId, auth.user.id);

  const title = input.title?.trim() || currentTask.title;
  const description = input.description === undefined ? currentTask.description : normalizeText(input.description);
  const status = input.status ?? currentTask.status;
  const priority = input.priority ?? currentTask.priority;

  let deadline = currentTask.deadline;
  if (input.deadline !== undefined) {
    deadline = parseIsoDate(input.deadline);
    if (input.deadline && !deadline) {
      throw badRequest("Deadline must be a valid ISO date.");
    }
  }

  const nextTask = await prisma.task.update({
    where: { id: currentTask.id },
    data: {
      title,
      description,
      status,
      priority,
      deadline,
      completedAt: status === "DONE" ? currentTask.completedAt ?? new Date() : null,
    },
  });

  await recordAuditLog({
    action: "TASK_UPDATED",
    message: `Updated task "${nextTask.title}"`,
    userId: auth.user.id,
    sessionId: auth.session.id,
    ipAddress: auth.session.ipAddress,
    userAgent: auth.session.userAgent,
  });

  return serializeTask(nextTask);
}

export async function deleteTask(auth: AuthContext, taskId: string) {
  const task = await getTaskOrThrow(taskId, auth.user.id);

  await prisma.task.delete({
    where: { id: task.id },
  });

  await recordAuditLog({
    action: "TASK_DELETED",
    message: `Deleted task "${task.title}"`,
    userId: auth.user.id,
    sessionId: auth.session.id,
    ipAddress: auth.session.ipAddress,
    userAgent: auth.session.userAgent,
  });

  return {
    success: true,
  };
}
