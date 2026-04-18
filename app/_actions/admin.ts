"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  canManageRoles,
  requireAdmin,
} from "@/lib/admin";
import {
  USER_ROLES,
  type UserRole,
  normalizeRole,
  setStoredRoleForUser,
} from "@/lib/roles";

const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"] as const;
type AccountStatusValue = (typeof ACCOUNT_STATUSES)[number];

export async function addGameAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const genre = String(formData.get("genre") || "").trim();

  if (!name || !slug) return;

  await prisma.game.upsert({
    where: { slug },
    update: { name, genre, active: true },
    create: { name, slug, genre, active: true },
  });

  revalidatePath("/admin");
  revalidatePath("/onboarding");
}

export async function moderateUserAction(formData: FormData) {
  const viewer = await requireAdmin();

  const userId = String(formData.get("userId") || "");
  const status = String(formData.get("status") || "") as AccountStatusValue;
  const moderationNote = String(formData.get("moderationNote") || "").trim();

  if (!userId || !ACCOUNT_STATUSES.includes(status)) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return;

  const targetRoleRows = await prisma.$queryRaw<Array<{ role: string | null }>>`
    SELECT "role" as role
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;
  const targetIsOwner = normalizeRole(targetRoleRows[0]?.role) === "OWNER";

  if (targetIsOwner && !canManageRoles({ email: viewer.email, role: viewer.role })) {
    return;
  }

  if (targetIsOwner && status !== "ACTIVE") {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: status,
      moderationNote: moderationNote || null,
      lookingForGroup: status === "ACTIVE",
    },
  });

  if (status !== "ACTIVE") {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath("/search");
}

export async function updateUserRoleAction(formData: FormData) {
  const viewer = await requireAdmin();
  if (!canManageRoles({ email: viewer.email, role: viewer.role })) {
    return;
  }

  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as UserRole;

  if (!userId || !USER_ROLES.includes(role)) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return;

  const targetRoleRows = await prisma.$queryRaw<Array<{ role: string | null }>>`
    SELECT "role" as role
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;
  const nextRole = normalizeRole(targetRoleRows[0]?.role) === "OWNER" ? "OWNER" : role;

  await setStoredRoleForUser(userId, nextRole);

  revalidatePath("/admin");
}
