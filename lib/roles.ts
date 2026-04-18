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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return normalizeRole(user?.role);
}

export async function getStoredRolesForUsers(
  userIds: string[]
): Promise<Map<string, UserRole>> {
  if (!userIds.length) {
    return new Map<string, UserRole>();
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true },
  });

  return new Map<string, UserRole>(
    rows.map((row) => [row.id, normalizeRole(row.role)] as const)
  );
}

export async function setStoredRoleForUser(userId: string, role: UserRole) {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}
