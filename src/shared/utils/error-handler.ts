import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, code?: string) {
  return new AppError(400, message, code);
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, message);
}

export function notFound(message = "Not found") {
  return new AppError(404, message);
}

export function conflict(message: string) {
  return new AppError(409, message);
}

/**
 * Wraps an API route handler with standardized error handling.
 * Catches AppError, ZodError, and unknown errors.
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: err.message, ...(err.code && { code: err.code }) },
          { status: err.statusCode }
        );
      }

      if (err instanceof ZodError) {
        const messages = err.issues.map((e) => e.message);
        return NextResponse.json(
          { error: "Validation failed", details: messages },
          { status: 400 }
        );
      }

      console.error("[API Error]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
