import "server-only";

import { prisma } from "@/lib/prisma";

export const USER_ROLES = ["USER", "MODERATOR", "OWNER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function normalizeRole(role?: string | null): UserRole {
  if (role === "OWNER" || role === "MODERATOR") {
    return role;
  }

  return "USER";
}

export function getEffectiveRole(input: {
  email?: string | null;
  role?: string | null;
}): UserRole {
  return normalizeRole(input.role);
}

export async function getStoredRoleForUser(userId: string): Promise<UserRole> {
  const rows = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return normalizeRole(rows[0]?.role);
}

export async function getStoredRolesForUsers(
  userIds: string[]
): Promise<Map<string, UserRole>> {
  if (!userIds.length) {
    return new Map<string, UserRole>();
  }

  const placeholders = userIds.map(() => "?").join(", ");
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; role: string }>>(
    `SELECT id, role FROM "User" WHERE id IN (${placeholders})`,
    ...userIds
  );

  return new Map<string, UserRole>(
    rows.map((row) => [row.id, normalizeRole(row.role)] as const)
  );
}

export async function setStoredRoleForUser(userId: string, role: UserRole) {
  await prisma.$executeRaw`
    UPDATE "User"
    SET role = ${role}
    WHERE id = ${userId}
  `;
}
