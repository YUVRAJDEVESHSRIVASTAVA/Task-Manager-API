import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof AppError ? error.status : 500;
  const message = error instanceof AppError ? error.message : fallbackMessage;

  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status },
  );
}
