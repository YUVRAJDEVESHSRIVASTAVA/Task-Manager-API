import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { createTask, getDashboardSnapshot } from "@/lib/task-service";
import { resolveSessionFromToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { taskSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const context = await resolveSessionFromToken(token);

    if (!context) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const snapshot = await getDashboardSnapshot(context.user.id);

    return NextResponse.json(
      {
        ok: true,
        snapshot,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not load tasks.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const context = await resolveSessionFromToken(token);

    if (!context) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please complete all required task fields.",
        },
        { status: 400 },
      );
    }

    const task = await createTask(context, parsed.data);

    return NextResponse.json(
      {
        ok: true,
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not create the task.");
  }
}
