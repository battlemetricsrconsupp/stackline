import "server-only";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getEffectiveRole } from "@/lib/roles";

export function canAccessAdmin(input: { email?: string | null; role?: string | null }) {
  const role = getEffectiveRole(input);
  return role === "OWNER" || role === "MODERATOR";
}

export function canManageRoles(input: { email?: string | null; role?: string | null }) {
  return getEffectiveRole(input) === "OWNER";
}

export async function requireAdmin() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (!canAccessAdmin({ email: viewer.email, role: viewer.role })) {
    redirect("/discover");
  }

  return {
    ...viewer,
    effectiveRole: getEffectiveRole({ email: viewer.email, role: viewer.role }),
  };
}
