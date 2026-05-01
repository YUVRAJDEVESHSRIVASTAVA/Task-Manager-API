import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { logoutAccount } from "@/lib/auth-service";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    await logoutAccount(token);

    const response = NextResponse.json(
      {
        ok: true,
      },
      { status: 200 },
    );

    clearSessionCookie(response);
    return response;
  } catch (error) {
    return routeErrorResponse(error, "Could not sign out.");
  }
}
