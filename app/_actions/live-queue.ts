"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import {
  sendPlayInvite,
  toggleLookingNow,
} from "@/lib/live-queue";

export async function toggleLookingNowAction(enabled: boolean) {
  const viewer = await requireViewer();
  await toggleLookingNow(viewer.id, enabled);

  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/messages");
  revalidatePath("/profile");
  revalidatePath("/settings");

  return { ok: true } as const;
}

export async function sendPlayInviteAction(input: {
  receiverId: string;
  gameSlug?: string | null;
}) {
  const viewer = await requireViewer();
  if (viewer.id === input.receiverId) {
    return { ok: false } as const;
  }

  await sendPlayInvite({
    senderId: viewer.id,
    receiverId: input.receiverId,
    gameSlug: input.gameSlug ?? null,
  });

  revalidatePath("/discover");
  revalidatePath("/messages");

  return { ok: true } as const;
}
