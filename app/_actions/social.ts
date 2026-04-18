"use server";

import { revalidatePath } from "next/cache";
import { touchUserActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/auth";
import { createNotification, trackAnalyticsEvent } from "@/lib/engagement";

function orderedPair(a: string, b: string) {
  return [a, b].sort();
}

export async function likePlayerAction(targetUserId: string) {
  const viewer = await requireViewer();
  if (viewer.id === targetUserId) return;
  await touchUserActivity(viewer.id);

  const blockedRelationship = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewer.id, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: viewer.id },
      ],
    },
  });
  if (blockedRelationship) return;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { accountStatus: true, onboardingCompleted: true },
  });
  if (!targetUser || targetUser.accountStatus !== "ACTIVE" || !targetUser.onboardingCompleted) {
    return;
  }

  await prisma.like.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: viewer.id,
        toUserId: targetUserId,
      },
    },
    update: {},
    create: {
      fromUserId: viewer.id,
      toUserId: targetUserId,
    },
  });

  const reciprocal = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: targetUserId,
        toUserId: viewer.id,
      },
    },
  });

  if (reciprocal) {
    const [userAId, userBId] = orderedPair(viewer.id, targetUserId);
    const match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: { status: "MATCHED" },
      create: { userAId, userBId, status: "MATCHED" },
    });

    const matchedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });
    await createNotification({
      userId: targetUserId,
      type: "MATCH_CREATED",
      title: "New match unlocked",
      body: `${viewer.username} matched with you.`,
      link: `/messages?match=${match.id}`,
    });
    await trackAnalyticsEvent("match_created", viewer.id, {
      matchId: match.id,
      targetUserId,
    });

    revalidatePath("/discover");
    revalidatePath("/search");
    revalidatePath("/messages");

    return {
      matched: true,
      username: matchedUser?.username ?? "New teammate",
    } as const;
  }

  revalidatePath("/discover");
  revalidatePath("/search");
  revalidatePath("/messages");

  return {
    matched: false,
  } as const;
}

export async function sendMessageAction(matchId: string, formData: FormData) {
  const viewer = await requireViewer();
  await touchUserActivity(viewer.id);
  const content = String(formData.get("content") || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!content) return;
  if (content.length > 500) return;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      status: "MATCHED",
      OR: [{ userAId: viewer.id }, { userBId: viewer.id }],
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
    },
  });

  if (!match) return;

  const otherUserId = match.userAId === viewer.id ? match.userBId : match.userAId;
  const blockedRelationship = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewer.id, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: viewer.id },
      ],
    },
  });
  if (blockedRelationship) return;

  await prisma.message.create({
    data: {
      matchId,
      senderId: viewer.id,
      content,
    },
  });

  const messageCount = await prisma.message.count({ where: { matchId } });
  if (messageCount === 1) {
    await trackAnalyticsEvent("chat_started", viewer.id, { matchId, otherUserId });
  }

  revalidatePath("/messages");
}

export async function reportPlayerAction(targetUserId: string, formData: FormData) {
  const viewer = await requireViewer();
  await touchUserActivity(viewer.id);
  const reason = String(formData.get("reason") || "").trim();
  const details = String(formData.get("details") || "").trim();

  if (!reason) return;

  await prisma.report.create({
    data: {
      reporterId: viewer.id,
      reportedUserId: targetUserId,
      reason,
      details,
    },
  });

  revalidatePath("/admin");
}

export async function blockPlayerAction(targetUserId: string) {
  const viewer = await requireViewer();
  if (viewer.id === targetUserId) return;
  await touchUserActivity(viewer.id);

  const [userAId, userBId] = orderedPair(viewer.id, targetUserId);

  await prisma.$transaction([
    prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: viewer.id,
          blockedId: targetUserId,
        },
      },
      update: {},
      create: {
        blockerId: viewer.id,
        blockedId: targetUserId,
      },
    }),
    prisma.like.deleteMany({
      where: {
        OR: [
          { fromUserId: viewer.id, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: viewer.id },
        ],
      },
    }),
    prisma.match.updateMany({
      where: { userAId, userBId },
      data: { status: "BLOCKED" },
    }),
  ]);

  revalidatePath("/discover");
  revalidatePath("/search");
  revalidatePath("/messages");
}
