import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { resolveSessionFromToken, SESSION_COOKIE_NAME } from "@/lib/session";

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

    return NextResponse.json(
      {
        ok: true,
        user: context.user,
        session: context.session,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not load the current session.");
  }
}
