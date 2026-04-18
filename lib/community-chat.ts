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

  const [rows, onlineCountRows] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        createdAt: string;
        userId: string;
        username: string;
        image: string | null;
        region: string | null;
        onlineStatus: string | null;
        currentlyPlaying: string | null;
        lastActiveAt: string | null;
      }>
    >(
      `
        SELECT
          cm."id" as id,
          cm."content" as content,
          cm."createdAt" as createdAt,
          u."id" as userId,
          u."username" as username,
          u."image" as image,
          u."region" as region,
          u."onlineStatus" as onlineStatus,
          u."currentlyPlaying" as currentlyPlaying,
          u."lastActiveAt" as lastActiveAt
        FROM "CommunityMessage" cm
        JOIN "User" u ON u."id" = cm."userId"
        WHERE u."accountStatus" = 'ACTIVE'
        ORDER BY cm."createdAt" DESC
        LIMIT ?
      `,
      limit
    ),
    prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*) as total
      FROM "User"
      WHERE "accountStatus" = 'ACTIVE'
        AND "onboardingCompleted" = true
        AND "onlineStatus" = 'Online'
    `,
  ]);

  return {
    onlineCount: Number(onlineCountRows[0]?.total ?? 0),
    messages: rows
      .reverse()
      .map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt,
        user: {
          id: row.userId,
          username: row.username,
          image: row.image,
          region: row.region,
          onlineStatus: normalizePresenceStatus(row.onlineStatus),
          currentlyPlaying: row.currentlyPlaying,
          lastActiveLabel: formatLastActive(row.lastActiveAt ? new Date(row.lastActiveAt) : null),
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

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "CommunityMessage" ("id", "userId", "content")
    VALUES (${id}, ${userId}, ${cleanedContent})
  `;

  const payload = await getCommunityChatData(1);
  return payload.messages[0] ?? null;
}
