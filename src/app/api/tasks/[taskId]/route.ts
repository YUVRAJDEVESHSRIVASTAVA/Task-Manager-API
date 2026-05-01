import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { deleteTask, updateTask } from "@/lib/task-service";
import { resolveSessionFromToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { taskPatchSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authContext = await resolveSessionFromToken(token);

    if (!authContext) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const { taskId } = await context.params;
    const body = await request.json();
    const parsed = taskPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide valid task updates.",
        },
        { status: 400 },
      );
    }

    const task = await updateTask(authContext, taskId, parsed.data);

    return NextResponse.json(
      {
        ok: true,
        task,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not update the task.");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authContext = await resolveSessionFromToken(token);

    if (!authContext) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const { taskId } = await context.params;
    const result = await deleteTask(authContext, taskId);

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not delete the task.");
  }
}
