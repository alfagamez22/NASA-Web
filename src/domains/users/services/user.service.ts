import { prisma } from "@/infrastructure/prisma/client";
import { logActivity } from "@/infrastructure/logging/activity-logger";
import { sendWelcomeEmail } from "@/infrastructure/email/email.service";
import { outranks, getRank, manageableRoles, type UserRole } from "@/domains/auth/services/role-hierarchy";
import { conflict, forbidden, notFound, badRequest } from "@/shared/utils/error-handler";
import bcrypt from "bcryptjs";

export type UserSelect = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  email: string | null;
};

export async function listUsers(callerRole: string) {
  const callerRank = getRank(callerRole);
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, displayName: true, role: true, createdAt: true,
      email: true, emailVerified: true, suspended: true, lastLoginAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return users.filter((u) => getRank(u.role) < callerRank);
}

export async function createUser(
  data: { username: string; password: string; displayName?: string; email?: string; role?: string },
  callerId: string,
  callerRole: string
): Promise<UserSelect> {
  const targetRole = data.role ?? "viewer";

  if (!outranks(callerRole, targetRole)) {
    throw forbidden("Cannot create accounts of equal or higher rank");
  }

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) throw conflict("Username already exists");

  if (data.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) throw conflict("Email already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      displayName: data.displayName ?? "",
      role: targetRole as UserRole,
      email: data.email || null,
      createdBy: callerId,
    },
    select: { id: true, username: true, displayName: true, role: true, email: true },
  });

  await logActivity({
    actorId: callerId,
    actionType: "account_created",
    targetId: user.id,
    metadata: { username: user.username, role: targetRole },
  });

  if (data.email) {
    sendWelcomeEmail(data.email, data.displayName ?? "", data.username).catch(() => {});
  }

  return user;
}

export async function updateUser(
  data: { id: string; username?: string; displayName?: string; email?: string | null; role?: string; password?: string },
  callerId: string,
  callerRole: string
): Promise<UserSelect> {
  const target = await prisma.user.findUnique({ where: { id: data.id } });
  if (!target) throw notFound("User not found");

  if (!outranks(callerRole, target.role)) {
    throw forbidden("Cannot modify accounts of equal or higher rank");
  }

  const updateData: Record<string, unknown> = {};

  if (data.displayName) updateData.displayName = data.displayName;

  if (data.role) {
    if (!outranks(callerRole, data.role)) {
      throw forbidden("Cannot assign a role equal to or above your own");
    }
    updateData.role = data.role;

    if (data.role !== target.role) {
      await prisma.permissionAuditLog.create({
        data: {
          whoChangedId: callerId,
          accountAffectedId: data.id,
          permissionChanged: "role",
          oldValue: target.role,
          newValue: data.role,
        },
      });
      await logActivity({
        actorId: callerId,
        actionType: "permission_changed",
        targetId: data.id,
        metadata: { field: "role", oldValue: target.role, newValue: data.role },
      });
    }
  }

  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

  if (data.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing && existing.id !== data.id) throw conflict("Username already exists");
    updateData.username = data.username;
  }

  if (data.email !== undefined) {
    if (data.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailExists && emailExists.id !== data.id) throw conflict("Email already in use");
    }
    updateData.email = data.email || null;
  }

  return prisma.user.update({
    where: { id: data.id },
    data: updateData,
    select: { id: true, username: true, displayName: true, role: true, email: true },
  });
}

export async function deleteUser(
  targetId: string,
  callerId: string,
  callerRole: string
) {
  if (targetId === callerId) {
    throw badRequest("Cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw notFound("User not found");

  if (!outranks(callerRole, target.role)) {
    throw forbidden("Cannot delete accounts of equal or higher rank");
  }

  await prisma.user.delete({ where: { id: targetId } });
  return { success: true };
}
