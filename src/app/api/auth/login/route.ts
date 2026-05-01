import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { loginAccount } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide a valid email and password.",
        },
        { status: 400 },
      );
    }

    const result = await loginAccount(parsed.data, request.headers);

    const response = NextResponse.json(
      {
        ok: true,
        user: result.user,
      },
      { status: 200 },
    );

    setSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error) {
    return routeErrorResponse(error, "Could not sign in.");
  }
}
