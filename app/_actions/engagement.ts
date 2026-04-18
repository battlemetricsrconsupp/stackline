"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { markNotificationsRead, respondToSessionPrompt, submitTeammateRating } from "@/lib/engagement";

export async function markNotificationsReadAction() {
  const viewer = await requireViewer();
  await markNotificationsRead(viewer.id);
  revalidatePath("/discover");
  revalidatePath("/messages");
}

export async function respondToSessionPromptAction(sessionId: string, played: boolean) {
  const viewer = await requireViewer();
  await respondToSessionPrompt({
    sessionId,
    userId: viewer.id,
    played,
  });

  revalidatePath("/discover");
  revalidatePath("/messages");
  revalidatePath("/profile");
}

export async function rateTeammateAction(sessionId: string, positive: boolean, formData: FormData) {
  const viewer = await requireViewer();
  await submitTeammateRating({
    sessionId,
    raterId: viewer.id,
    positive,
    note: String(formData.get("note") || "").trim() || null,
  });

  revalidatePath("/discover");
  revalidatePath("/messages");
  revalidatePath("/profile");
}
