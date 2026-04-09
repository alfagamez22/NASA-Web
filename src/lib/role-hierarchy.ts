/**
 * Role Hierarchy (F11)
 *
 * 4-tier role system: super_admin(4) > admin(3) > editor(2) > viewer(1)
 * Higher rank can manage all lower ranks; no peer management allowed.
 */

export type UserRole = "super_admin" | "admin" | "editor" | "viewer";

const ROLE_RANK: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/** Get numeric rank for a role string. Returns 0 for unknown roles. */
export function getRank(role: string): number {
  return ROLE_RANK[role as UserRole] ?? 0;
}

/** Check if actorRole outranks targetRole (strictly greater). */
export function outranks(actorRole: string, targetRole: string): boolean {
  return getRank(actorRole) > getRank(targetRole);
}

/** Check if actorRole is at least minRole. */
export function hasMinRole(actorRole: string, minRole: UserRole): boolean {
  return getRank(actorRole) >= getRank(minRole);
}

/**
 * Returns the roles that the given actor role is allowed to create/manage.
 * - super_admin can manage: admin, editor, viewer
 * - admin can manage: editor, viewer (and admin only if gated — handled elsewhere)
 * - editor/viewer: cannot create accounts
 */
export function manageableRoles(actorRole: string): UserRole[] {
  const rank = getRank(actorRole);
  return (Object.entries(ROLE_RANK) as [UserRole, number][])
    .filter(([, r]) => r < rank)
    .map(([role]) => role)
    .sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a]);
}

/** All roles in descending order of rank. */
export const ALL_ROLES: UserRole[] = ["super_admin", "admin", "editor", "viewer"];
