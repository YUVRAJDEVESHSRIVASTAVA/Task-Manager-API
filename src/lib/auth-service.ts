import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { conflict, unauthorized } from "./errors";
import { createSession, resolveSessionFromToken } from "./session";
import { recordAuditLog } from "./audit";
import { serializeSession, serializeUser } from "./serializers";
import type { AuthContext } from "./session";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeUserName(name: string) {
  return name.trim() || "User";
}

export async function registerAccount(input: RegisterInput, headers: Headers) {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw conflict("An account with that email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(input.password),
    },
  });

  const sessionRecord = await createSession(user.id, headers);
  const now = new Date();

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: now,
    },
  });

  await recordAuditLog({
    action: "USER_REGISTERED",
    message: `Created account for ${normalizeUserName(updatedUser.name)}`,
    userId: updatedUser.id,
    sessionId: sessionRecord.session.id,
    ipAddress: sessionRecord.metadata.ipAddress,
    userAgent: sessionRecord.metadata.userAgent,
  });

  await recordAuditLog({
    action: "USER_LOGGED_IN",
    message: `${normalizeUserName(updatedUser.name)} signed in`,
    userId: updatedUser.id,
    sessionId: sessionRecord.session.id,
    ipAddress: sessionRecord.metadata.ipAddress,
    userAgent: sessionRecord.metadata.userAgent,
  });

  return {
    user: serializeUser(updatedUser),
    session: serializeSession({
      ...sessionRecord.session,
      user: updatedUser,
    }),
    token: sessionRecord.token,
    expiresAt: sessionRecord.expiresAt,
  } satisfies AuthContext & { token: string; expiresAt: Date };
}

export async function loginAccount(input: LoginInput, headers: Headers) {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw unauthorized("Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw unauthorized("Invalid email or password.");
  }

  const sessionRecord = await createSession(user.id, headers);
  const now = new Date();

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: now,
    },
  });

  await recordAuditLog({
    action: "USER_LOGGED_IN",
    message: `${normalizeUserName(updatedUser.name)} signed in`,
    userId: updatedUser.id,
    sessionId: sessionRecord.session.id,
    ipAddress: sessionRecord.metadata.ipAddress,
    userAgent: sessionRecord.metadata.userAgent,
  });

  return {
    user: serializeUser(updatedUser),
    session: serializeSession({
      ...sessionRecord.session,
      user: updatedUser,
    }),
    token: sessionRecord.token,
    expiresAt: sessionRecord.expiresAt,
  } satisfies AuthContext & { token: string; expiresAt: Date };
}

export async function logoutAccount(token: string | null | undefined) {
  const context = await resolveSessionFromToken(token);

  if (!context) {
    return null;
  }

  const session = await prisma.session.update({
    where: { id: context.session.id },
    data: {
      revokedAt: new Date(),
    },
    include: {
      user: true,
    },
  });

  const now = new Date();

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      lastLogoutAt: now,
    },
  });

  await recordAuditLog({
    action: "USER_LOGGED_OUT",
    message: `${normalizeUserName(session.user.name)} signed out`,
    userId: session.userId,
    sessionId: session.id,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
  });

  return context;
}
