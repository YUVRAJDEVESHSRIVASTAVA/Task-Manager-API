import { z } from "zod";
import { taskPriorities, taskStatuses } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const taskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  deadline: z.string().trim().optional().or(z.literal("")),
});

export const taskPatchSchema = taskSchema.partial();
