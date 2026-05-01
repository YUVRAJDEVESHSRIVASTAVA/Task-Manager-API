import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { forbidden } from "@/lib/errors";
import { getAdminOverview } from "@/lib/admin-service";
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

    if (context.user.role !== "ADMIN") {
      throw forbidden("Admin access required.");
    }

    const overview = await getAdminOverview();

    return NextResponse.json(
      {
        ok: true,
        overview,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, "Could not load admin overview.");
  }
}
