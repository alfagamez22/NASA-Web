/**
 * System Activity Logger (F12)
 *
 * Centralised helper for recording system activity log entries.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type SystemAction =
  | "login"
  | "logout"
  | "otp_sent"
  | "otp_verified"
  | "otp_failed"
  | "password_changed"
  | "email_verified"
  | "account_created"
  | "account_suspended"
  | "account_unsuspended"
  | "permission_changed"
  | "session_revoked"
  | "db_destructive_query";

interface LogParams {
  actorId: string;
  actionType: SystemAction;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  immutable?: boolean;
}

export async function logActivity(params: LogParams) {
  try {
    await prisma.systemActivityLog.create({
      data: {
        actorId: params.actorId,
        actionType: params.actionType,
        targetId: params.targetId,
        metadata: params.metadata !== undefined ? (params.metadata as Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        immutable: params.immutable ?? false,
      },
    });
  } catch (err) {
    // Never let logging failure break the main flow
    console.error("[activity-log]", err);
  }
}
