import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api";
import { registerAccount } from "@/lib/auth-service";
import { setSessionCookie } from "@/lib/session";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide a valid name, email, and password.",
        },
        { status: 400 },
      );
    }

    const result = await registerAccount(parsed.data, request.headers);

    const response = NextResponse.json(
      {
        ok: true,
        user: result.user,
      },
      { status: 201 },
    );

    setSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error) {
    return routeErrorResponse(error, "Could not create the account.");
  }
}
