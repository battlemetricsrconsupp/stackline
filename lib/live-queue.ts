import "server-only";

import { randomUUID } from "node:crypto";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import { formatLastActive, getPresenceMap, touchUserActivity } from "@/lib/activity";
import { computeCompatibilityDetails } from "@/lib/compatibility";
import {
  createNotification,
  createPlaySessionFromInvite,
  ensureEngagementSchema,
  getUserTrustMap,
  trackAnalyticsEvent,
} from "@/lib/engagement";

const LIVE_QUEUE_TIMEOUT_MINUTES = 30;

type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

const userInclude = {
  languages: true,
  playstyles: true,
  playTimes: true,
  gameProfiles: {
    include: {
      game: true,
    },
  },
} as const;

let ensuredLiveQueueSchema: Promise<void> | null = null;

export async function ensureLiveQueueSchema() {
  if (!ensuredLiveQueueSchema) {
    ensuredLiveQueueSchema = Promise.resolve();
  }

  return ensuredLiveQueueSchema;
}

function statusPriority(status?: string | null) {
  if (status === "Online") return 3;
  if (status === "Away") return 2;
  return 1;
}

async function expireInactiveLookingNowUsers() {
  await ensureLiveQueueSchema();

  try {
    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "isLookingNow" = false,
          "lookingNowStartedAt" = NULL
      WHERE "isLookingNow" = true
        AND (
          "lastActiveAt" IS NULL
          OR "lastActiveAt" < NOW() - INTERVAL '${LIVE_QUEUE_TIMEOUT_MINUTES} minutes'
        )
    `);
  } catch {
    return;
  }
}

async function getBlockedIdsForUser(userId: string) {
  const blocked = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
  });

  return new Set(blocked.flatMap((entry) => [entry.blockerId, entry.blockedId]));
}

export async function getLookingNowState(userId: string) {
  await expireInactiveLookingNowUsers();
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isLookingNow: true, lookingNowStartedAt: true },
  });
  return {
    isLookingNow: Boolean(row?.isLookingNow),
    lookingNowStartedAt: row?.lookingNowStartedAt ?? null,
  };
}

export async function getLookingNowMap(userIds: string[]) {
  await expireInactiveLookingNowUsers();

  if (!userIds.length) {
    return new Map<string, Date | null>();
  }
  const rows = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isLookingNow: true,
    },
    select: {
      id: true,
      lookingNowStartedAt: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.id,
      row.lookingNowStartedAt ?? null,
    ])
  );
}

export async function toggleLookingNow(userId: string, enabled: boolean) {
  await ensureLiveQueueSchema();
  await touchUserActivity(userId, { onlineStatus: "Online" });

  if (enabled) {
    await prisma.$executeRaw`
      UPDATE "User"
      SET "isLookingNow" = true,
          "lookingNowStartedAt" = CURRENT_TIMESTAMP,
          "onlineStatus" = 'Online'
      WHERE "id" = ${userId}
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE "User"
    SET "isLookingNow" = false,
        "lookingNowStartedAt" = NULL
    WHERE "id" = ${userId}
  `;
}

function buildSnapshot(user: {
  age: number | null;
  region: string | null;
  timezone: string | null;
  languages: Array<{ language: string }>;
  playstyles: Array<{ tag: string }>;
  playTimes: Array<{ label: string }>;
  gameProfiles: Array<{
    gameId: string;
    rankLabel: string;
    game: { name: string; slug: string };
  }>;
}) {
  return {
    age: user.age,
    region: user.region,
    timezone: user.timezone,
    languages: user.languages.map((item) => item.language),
    playstyles: user.playstyles.map((item) => item.tag),
    playTimes: user.playTimes.map((item) => item.label),
    gameProfiles: user.gameProfiles.map((item) => ({
      gameId: item.gameId,
      rankLabel: item.rankLabel,
      gameName: item.game.name,
    })),
  };
}

export async function getLiveQueue(viewerId?: string) {
  try {
    await expireInactiveLookingNowUsers();

    const [viewer, blockedIds] = viewerId
      ? await Promise.all([
          prisma.user.findUnique({
            where: { id: viewerId },
            include: userInclude,
          }),
          getBlockedIdsForUser(viewerId),
        ])
      : [null, new Set<string>()];

    if (viewerId) {
      blockedIds.add(viewerId);
    }

    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        accountStatus: "ACTIVE",
        lookingForGroup: true,
        ...(blockedIds.size ? { id: { notIn: Array.from(blockedIds) } } : {}),
      },
      include: userInclude,
      orderBy: { updatedAt: "desc" },
    });

    const lookingNowMap = await getLookingNowMap(users.map((user) => user.id));
    const liveUsers = users.filter((user) => lookingNowMap.has(user.id));
    const [presenceMap, trustMap] = await Promise.all([
      getPresenceMap(liveUsers.map((user) => user.id)),
      getUserTrustMap(liveUsers.map((user) => user.id)),
    ]);

    const viewerSnapshot = viewer ? buildSnapshot(viewer) : null;

    const players = liveUsers
      .map((user) => {
        const presence =
          presenceMap.get(user.id) ?? {
            onlineStatus: "Offline" as const,
            currentlyPlaying: null,
            lastActiveAt: null,
          };

        const compatibility = viewerSnapshot
          ? computeCompatibilityDetails(viewerSnapshot, buildSnapshot(user))
          : {
              score: 0,
              reasons: [] as string[],
              sharedGameCount: 0,
              sameRankCount: 0,
              sameRegion: false,
              sharedPlaystyleCount: 0,
              sharedPlaytimeCount: 0,
            };

        const primaryGameProfile =
          user.gameProfiles.find((profile) => profile.game.name === presence.currentlyPlaying) ??
          user.gameProfiles[0] ??
          null;
        const lookingNowStartedAt = lookingNowMap.get(user.id) ?? null;

        return {
          ...user,
          presence,
          trust: trustMap.get(user.id) ?? {
            reliabilityScore: 65,
            badges: [],
            positiveRatings: 0,
            negativeRatings: 0,
            activeDays: 0,
            activityStreak: 0,
            sessionsPlayed: 0,
          },
          compatibility,
          primaryGameName:
            presence.currentlyPlaying ?? primaryGameProfile?.game.name ?? BRAND.name,
          primaryGameRank: primaryGameProfile?.rankLabel ?? "Unranked",
          primaryGameSlug: primaryGameProfile?.game.slug ?? null,
          lookingNowStartedAt,
          lookingNowLabel: lookingNowStartedAt
            ? formatLastActive(lookingNowStartedAt).replace("Active", "Joined queue")
            : "Joined queue recently",
        };
      })
      .sort((a, b) => {
        if (viewerSnapshot) {
          if (b.compatibility.sharedGameCount !== a.compatibility.sharedGameCount) {
            return b.compatibility.sharedGameCount - a.compatibility.sharedGameCount;
          }
          const liveDiff =
            Number(Boolean(b.lookingNowStartedAt)) - Number(Boolean(a.lookingNowStartedAt));
          if (liveDiff !== 0) {
            return liveDiff;
          }
          if (b.compatibility.sameRankCount !== a.compatibility.sameRankCount) {
            return b.compatibility.sameRankCount - a.compatibility.sameRankCount;
          }
          if (Number(b.compatibility.sameRegion) !== Number(a.compatibility.sameRegion)) {
            return Number(b.compatibility.sameRegion) - Number(a.compatibility.sameRegion);
          }
          if (
            b.compatibility.sharedPlaystyleCount !== a.compatibility.sharedPlaystyleCount
          ) {
            return (
              b.compatibility.sharedPlaystyleCount - a.compatibility.sharedPlaystyleCount
            );
          }
        }

        const onlineDiff =
          statusPriority(b.presence.onlineStatus) - statusPriority(a.presence.onlineStatus);
        if (onlineDiff !== 0) {
          return onlineDiff;
        }

        return (
          (b.presence.lastActiveAt?.getTime() ?? 0) - (a.presence.lastActiveAt?.getTime() ?? 0)
        );
      });

    const perGame = new Map<string, number>();
    for (const player of players) {
      perGame.set(player.primaryGameName, (perGame.get(player.primaryGameName) ?? 0) + 1);
    }

    return {
      totalLookingNow: players.length,
      inYourRankCount: players.filter((player) => player.compatibility.sameRankCount > 0).length,
      inYourGameCount: players.filter((player) => player.compatibility.sharedGameCount > 0)
        .length,
      perGame: Array.from(perGame.entries())
        .map(([gameName, total]) => ({ gameName, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4),
      players: players.slice(0, 8),
    };
  } catch {
    return {
      totalLookingNow: 0,
      inYourRankCount: 0,
      inYourGameCount: 0,
      perGame: [],
      players: [],
    };
  }
}

export async function sendPlayInvite(input: {
  senderId: string;
  receiverId: string;
  gameSlug?: string | null;
}) {
  await ensureLiveQueueSchema();
  await ensureEngagementSchema();
  await touchUserActivity(input.senderId, { onlineStatus: "Online" });

  await prisma.$executeRaw`
    UPDATE "PlayInvite"
    SET "status" = 'DECLINED',
        "respondedAt" = CURRENT_TIMESTAMP
    WHERE "senderId" = ${input.senderId}
      AND "receiverId" = ${input.receiverId}
      AND "status" = 'PENDING'
  `;

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "PlayInvite" ("id", "senderId", "receiverId", "gameSlug", "status")
    VALUES (${id}, ${input.senderId}, ${input.receiverId}, ${input.gameSlug ?? null}, 'PENDING')
  `;

  const sender = await prisma.user.findUnique({
    where: { id: input.senderId },
    select: { username: true },
  });
  await createNotification({
    userId: input.receiverId,
    type: "PLAY_INVITE",
    title: "You got a play invite",
    body: `${sender?.username ?? "A player"} wants to queue now.`,
    link: "/discover",
  });
  await trackAnalyticsEvent("invite_sent", input.senderId, {
    receiverId: input.receiverId,
    gameSlug: input.gameSlug ?? null,
  });

  return { id };
}

export async function getPendingPlayInvites(userId: string) {
  await ensureLiveQueueSchema();

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    senderId: string;
    receiverId: string;
    gameSlug: string | null;
    status: InviteStatus;
    createdAt: Date;
    senderUsername: string;
    senderRegion: string | null;
    senderOnlineStatus: string | null;
  }>>`
    SELECT
      pi."id" as id,
      pi."senderId" as senderId,
      pi."receiverId" as receiverId,
      pi."gameSlug" as gameSlug,
      pi."status" as status,
      pi."createdAt" as createdAt,
      u."username" as senderUsername,
      u."region" as senderRegion,
      u."onlineStatus" as senderOnlineStatus
    FROM "PlayInvite" pi
    JOIN "User" u ON u."id" = pi."senderId"
    WHERE pi."receiverId" = ${userId}
      AND pi."status" = 'PENDING'
    ORDER BY pi."createdAt" DESC
  `;

  return rows;
}

export async function getOutgoingPendingInviteIds(userId: string) {
  await ensureLiveQueueSchema();

  const rows = await prisma.$queryRaw<Array<{ receiverId: string }>>`
    SELECT "receiverId" as receiverId
    FROM "PlayInvite"
    WHERE "senderId" = ${userId}
      AND "status" = 'PENDING'
  `;

  return new Set(rows.map((row) => row.receiverId));
}

export async function respondToPlayInvite(input: {
  inviteId: string;
  receiverId: string;
  accept: boolean;
}) {
  await ensureLiveQueueSchema();
  await ensureEngagementSchema();
  await touchUserActivity(input.receiverId, { onlineStatus: "Online" });

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    senderId: string;
    receiverId: string;
    gameSlug: string | null;
  }>>`
    SELECT "id", "senderId", "receiverId", "gameSlug"
    FROM "PlayInvite"
    WHERE "id" = ${input.inviteId}
      AND "receiverId" = ${input.receiverId}
      AND "status" = 'PENDING'
    LIMIT 1
  `;

  const invite = rows[0];
  if (!invite) {
    return null;
  }

  await prisma.$executeRaw`
    UPDATE "PlayInvite"
    SET "status" = ${input.accept ? "ACCEPTED" : "DECLINED"},
        "respondedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.inviteId}
  `;

  if (!input.accept) {
    await trackAnalyticsEvent("invite_declined", input.receiverId, {
      inviteId: input.inviteId,
      senderId: invite.senderId,
    });
    return { accepted: false } as const;
  }

  const [userAId, userBId] = [invite.senderId, invite.receiverId].sort();
  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: { status: "MATCHED" },
    create: { userAId, userBId, status: "MATCHED" },
  });

  await prisma.like.upsert({
    where: {
      fromUserId_toUserId: { fromUserId: invite.senderId, toUserId: invite.receiverId },
    },
    update: {},
    create: { fromUserId: invite.senderId, toUserId: invite.receiverId },
  });

  await prisma.like.upsert({
    where: {
      fromUserId_toUserId: { fromUserId: invite.receiverId, toUserId: invite.senderId },
    },
    update: {},
    create: { fromUserId: invite.receiverId, toUserId: invite.senderId },
  });

  const gameName = invite.gameSlug
    ? (
        await prisma.game.findUnique({
          where: { slug: invite.gameSlug },
          select: { name: true },
        })
      )?.name
    : null;

  const existingMessages = await prisma.message.count({ where: { matchId: match.id } });
  if (!existingMessages) {
    await prisma.message.createMany({
      data: [
        {
          matchId: match.id,
          senderId: invite.senderId,
          content: `Ready to queue${gameName ? ` for ${gameName}` : ""}?`,
        },
        {
          matchId: match.id,
          senderId: invite.receiverId,
          content: "Accepted. I'm ready now.",
        },
      ],
    });
  }

  await createPlaySessionFromInvite({
    inviteId: invite.id,
    matchId: match.id,
    senderId: invite.senderId,
    receiverId: invite.receiverId,
    gameSlug: invite.gameSlug ?? null,
  });

  const receiver = await prisma.user.findUnique({
    where: { id: invite.receiverId },
    select: { username: true },
  });
  await createNotification({
    userId: invite.senderId,
    type: "INVITE_ACCEPTED",
    title: "Your invite was accepted",
    body: `${receiver?.username ?? "Your teammate"} is ready to queue.`,
    link: `/messages?match=${match.id}`,
  });
  await trackAnalyticsEvent("invite_accepted", input.receiverId, {
    inviteId: input.inviteId,
    senderId: invite.senderId,
    matchId: match.id,
  });

  return {
    accepted: true,
    matchId: match.id,
  } as const;
}
