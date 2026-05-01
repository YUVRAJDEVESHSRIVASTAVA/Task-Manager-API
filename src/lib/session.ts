import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "./constants";
export { SESSION_COOKIE_NAME } from "./constants";
import { serializeSession, serializeUser } from "./serializers";
import type { SerializedSession, SerializedUser } from "./types";

export type RequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type AuthContext = {
  user: SerializedUser;
  session: SerializedSession;
};

const sessionDurationMs = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getRequestMetadata(headers: Headers): RequestMetadata {
  const forwardedFor = headers.get("x-forwarded-for") ?? headers.get("x-real-ip");

  return {
    ipAddress: forwardedFor ? forwardedFor.split(",")[0]?.trim() ?? null : null,
    userAgent: headers.get("user-agent"),
  };
}

export async function createSession(userId: string, headers: Headers) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionDurationMs);
  const metadata = getRequestMetadata(headers);

  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      lastSeenAt: now,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });

  return {
    token,
    expiresAt,
    session,
    metadata,
  };
}

export async function resolveSessionFromToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  const now = new Date();

  if (session.revokedAt || session.expiresAt <= now) {
    if (!session.revokedAt) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: now },
      });
    }

    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: now },
  });

  return {
    user: serializeUser(session.user),
    session: serializeSession({
      ...session,
      lastSeenAt: now,
    }),
  } satisfies AuthContext;
}

export async function getCurrentAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return resolveSessionFromToken(token);
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
