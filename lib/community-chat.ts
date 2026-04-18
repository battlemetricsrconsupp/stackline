import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { formatLastActive, touchUserActivity } from "@/lib/activity";

let ensuredCommunityChatSchema: Promise<void> | null = null;

export type CommunityChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    image: string | null;
    region: string | null;
    onlineStatus: "Online" | "Away" | "Offline";
    currentlyPlaying: string | null;
    lastActiveLabel: string;
  };
};

async function ensureCommunityChatSchema() {
  if (!ensuredCommunityChatSchema) {
    ensuredCommunityChatSchema = Promise.resolve();
  }

  return ensuredCommunityChatSchema;
}

function normalizePresenceStatus(status?: string | null): "Online" | "Away" | "Offline" {
  if (status === "Away" || status === "Offline") {
    return status;
  }

  return "Online";
}

export async function getCommunityChatData(limit = 80) {
  await ensureCommunityChatSchema();

  const [rows, onlineCount] = await Promise.all([
    prisma.communityMessage.findMany({
      where: {
        user: {
          accountStatus: "ACTIVE",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            region: true,
            onlineStatus: true,
            currentlyPlaying: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.user.count({
      where: {
        accountStatus: "ACTIVE",
        onboardingCompleted: true,
        onlineStatus: "Online",
      },
    }),
  ]);

  return {
    onlineCount,
    messages: rows
      .reverse()
      .map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        user: {
          id: row.user.id,
          username: row.user.username,
          image: row.user.image,
          region: row.user.region,
          onlineStatus: normalizePresenceStatus(row.user.onlineStatus),
          currentlyPlaying: row.user.currentlyPlaying,
          lastActiveLabel: formatLastActive(row.user.lastActiveAt),
        },
      })),
  };
}

export async function postCommunityMessage(userId: string, content: string) {
  await ensureCommunityChatSchema();
  const cleanedContent = content.replace(/\s+/g, " ").trim();

  if (!cleanedContent || cleanedContent.length > 400) {
    return null;
  }

  await touchUserActivity(userId, { onlineStatus: "Online" });

  await prisma.communityMessage.create({
    data: {
      id: randomUUID(),
      userId,
      content: cleanedContent,
    },
  });

  const payload = await getCommunityChatData(1);
  return payload.messages[0] ?? null;
}
