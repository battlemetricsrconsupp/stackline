import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPresenceMap } from "@/lib/activity";

type SessionStatus = "PENDING" | "COMPLETED" | "NO_SHOW";

let ensuredEngagementSchema: Promise<void> | null = null;

export async function ensureEngagementSchema() {
  if (!ensuredEngagementSchema) {
    ensuredEngagementSchema = Promise.resolve();
  }

  return ensuredEngagementSchema;
}

export function computeReliabilityScore(input: {
  positiveRatings?: number | null;
  negativeRatings?: number | null;
  sessionsPlayed?: number | null;
}) {
  const positiveRatings = Number(input.positiveRatings ?? 0);
  const negativeRatings = Number(input.negativeRatings ?? 0);
  const sessionsPlayed = Number(input.sessionsPlayed ?? 0);
  const totalRatings = positiveRatings + negativeRatings;

  if (!totalRatings) {
    return Math.min(90, 65 + sessionsPlayed * 3);
  }

  return Math.max(20, Math.min(99, Math.round((positiveRatings / totalRatings) * 100)));
}

export function getTrustBadges(input: {
  positiveRatings?: number | null;
  negativeRatings?: number | null;
  sessionsPlayed?: number | null;
  activeDays?: number | null;
  activityStreak?: number | null;
}) {
  const reliabilityScore = computeReliabilityScore(input);
  const badges: string[] = [];

  if (reliabilityScore >= 80 && Number(input.positiveRatings ?? 0) >= 2) {
    badges.push("Reliable teammate");
  }
  if (Number(input.positiveRatings ?? 0) >= 4 && Number(input.negativeRatings ?? 0) <= 1) {
    badges.push("High comms rating");
  }
  if (
    Number(input.activityStreak ?? 0) >= 3 ||
    Number(input.activeDays ?? 0) >= 5
  ) {
    badges.push("Frequently active");
  }

  return badges;
}

export async function trackAnalyticsEvent(
  type: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
) {
  await ensureEngagementSchema();

  await prisma.analyticsEvent.create({
    data: {
      id: randomUUID(),
      type,
      userId: userId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  await ensureEngagementSchema();

  await prisma.notification.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

async function hasRecentNotification(userId: string, type: string, bodyLike: string, hours: number) {
  const cutoff = new Date(Date.now() - hours * 60 * 60_000);
  const total = await prisma.notification.count({
    where: {
      userId,
      type,
      body: bodyLike,
      createdAt: { gte: cutoff },
    },
  });

  return total > 0;
}

export async function listNotifications(userId: string) {
  await ensureEngagementSchema();

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function markNotificationsRead(userId: string) {
  await ensureEngagementSchema();

  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function createPlaySessionFromInvite(input: {
  inviteId: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  gameSlug?: string | null;
}) {
  await ensureEngagementSchema();

  const existing = await prisma.playSession.findFirst({
    where: { playInviteId: input.inviteId },
    select: { id: true },
  });

  if (existing?.id) {
    return existing.id;
  }

  const sessionId = randomUUID();
  const promptAfter = new Date(Date.now() + 45 * 60_000).toISOString();
  const [userAId, userBId] = [input.senderId, input.receiverId].sort();

  await prisma.playSession.create({
    data: {
      id: sessionId,
      playInviteId: input.inviteId,
      matchId: input.matchId,
      userAId,
      userBId,
      initiatorId: input.senderId,
      gameSlug: input.gameSlug ?? null,
      promptAfterAt: new Date(promptAfter),
    },
  });

  await prisma.user.updateMany({
    where: {
      id: { in: [input.senderId, input.receiverId] },
    },
    data: {
      sessionsPlayed: { increment: 1 },
    },
  });

  await trackAnalyticsEvent("session_started", input.senderId, {
    receiverId: input.receiverId,
    gameSlug: input.gameSlug ?? null,
  });

  return sessionId;
}

async function recalculateUserRatings(userId: string) {
  const [positive, negative] = await Promise.all([
    prisma.teammateRating.count({
      where: {
        ratedUserId: userId,
        value: 1,
      },
    }),
    prisma.teammateRating.count({
      where: {
        ratedUserId: userId,
        value: -1,
      },
    }),
  ]);

  await prisma.user.update({
    where: { id: userId },
    data: {
      positiveRatings: positive,
      negativeRatings: negative,
    },
  });
}

export async function submitTeammateRating(input: {
  sessionId: string;
  raterId: string;
  positive: boolean;
  note?: string | null;
}) {
  await ensureEngagementSchema();

  const session = await prisma.playSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      status: true,
    },
  });
  if (!session) {
    return null;
  }

  const ratedUserId =
    session.userAId === input.raterId ? session.userBId : session.userAId;

  const existingRating = await prisma.teammateRating.findFirst({
    where: {
      sessionId: input.sessionId,
      raterId: input.raterId,
    },
    select: { id: true },
  });

  if (existingRating) {
    await prisma.teammateRating.update({
      where: { id: existingRating.id },
      data: {
        value: input.positive ? 1 : -1,
        note: input.note ?? null,
        createdAt: new Date(),
      },
    });
  } else {
    await prisma.teammateRating.create({
      data: {
        id: randomUUID(),
        sessionId: input.sessionId,
        raterId: input.raterId,
        ratedUserId,
        value: input.positive ? 1 : -1,
        note: input.note ?? null,
      },
    });
  }

  await recalculateUserRatings(ratedUserId);
  await createNotification({
    userId: ratedUserId,
    type: input.positive ? "RATING_POSITIVE" : "RATING_NEGATIVE",
    title: input.positive ? "You earned a teammate thumbs-up" : "Session feedback received",
    body: input.positive
      ? "A recent teammate marked you as a good teammate."
      : "A recent teammate marked the session as a bad fit.",
    link: "/profile",
  });
  await trackAnalyticsEvent("rating_submitted", input.raterId, {
    ratedUserId,
    value: input.positive ? 1 : -1,
  });

  return { ratedUserId };
}

export async function getPendingSessionPrompts(userId: string) {
  await ensureEngagementSchema();

  const sessions = await prisma.playSession.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      promptAfterAt: { lte: new Date() },
      status: { in: ["PENDING", "COMPLETED"] },
    },
    include: {
      userA: {
        select: {
          username: true,
        },
      },
      userB: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 12,
  });

  const ratings = sessions.length
    ? await prisma.teammateRating.findMany({
        where: {
          sessionId: { in: sessions.map((session) => session.id) },
          raterId: userId,
        },
        select: {
          sessionId: true,
        },
      })
    : [];
  const ratedSessionIds = new Set(ratings.map((rating) => rating.sessionId));

  return sessions
    .filter((session) => session.status === "PENDING" || !ratedSessionIds.has(session.id))
    .slice(0, 3)
    .map((session) => {
      const isUserA = session.userAId === userId;
      return {
        id: session.id,
        matchId: session.matchId,
        gameSlug: session.gameSlug,
        status: session.status as SessionStatus,
        startedAt: session.startedAt,
        promptAfterAt: session.promptAfterAt,
        userAId: session.userAId,
        userBId: session.userBId,
        initiatorId: session.initiatorId,
        otherUsername: isUserA ? session.userB.username : session.userA.username,
        alreadyRated: ratedSessionIds.has(session.id) ? 1 : 0,
        alreadyConfirmed: (isUserA ? session.userAConfirmedAt : session.userBConfirmedAt)
          ? "confirmed"
          : null,
      };
    });
}

export async function respondToSessionPrompt(input: {
  sessionId: string;
  userId: string;
  played: boolean;
}) {
  await ensureEngagementSchema();

  const session = await prisma.playSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      matchId: true,
      status: true,
    },
  });
  if (!session) return null;

  const otherUserId = session.userAId === input.userId ? session.userBId : session.userAId;
  await prisma.playSession.update({
    where: { id: input.sessionId },
    data: {
      ...(session.userAId === input.userId
        ? { userAConfirmedAt: new Date() }
        : { userBConfirmedAt: new Date() }),
      status: input.played ? "COMPLETED" : "NO_SHOW",
      completedAt: input.played ? new Date() : undefined,
    },
  });

  if (!input.played) {
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: input.userId,
        reportedUserId: otherUserId,
        reason: "No-show after accepted invite",
      },
    });

    if (!existingReport) {
      await prisma.report.create({
        data: {
          reporterId: input.userId,
          reportedUserId: otherUserId,
          reason: "No-show after accepted invite",
          details: "Marked through the post-session follow-up flow.",
        },
      });
    }
  }

  await trackAnalyticsEvent(input.played ? "session_completed" : "session_no_show", input.userId, {
    sessionId: input.sessionId,
    otherUserId,
  });

  return { otherUserId, matchId: session.matchId };
}

export async function getRecentlyPlayedWith(userId: string) {
  await ensureEngagementSchema();

  const sessions = await prisma.playSession.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: "COMPLETED",
    },
    include: {
      userA: {
        select: {
          id: true,
          username: true,
          region: true,
          positiveRatings: true,
          negativeRatings: true,
          activeDays: true,
          activityStreak: true,
          sessionsPlayed: true,
        },
      },
      userB: {
        select: {
          id: true,
          username: true,
          region: true,
          positiveRatings: true,
          negativeRatings: true,
          activeDays: true,
          activityStreak: true,
          sessionsPlayed: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 6,
  });

  const normalizedSessions = sessions.map((session) => {
    const otherUser = session.userAId === userId ? session.userB : session.userA;
    return {
      sessionId: session.id,
      matchId: session.matchId,
      startedAt: session.startedAt,
      otherUserId: otherUser.id,
      otherUsername: otherUser.username,
      otherRegion: otherUser.region,
      gameSlug: session.gameSlug,
      positiveRatings: otherUser.positiveRatings,
      negativeRatings: otherUser.negativeRatings,
      activeDays: otherUser.activeDays,
      activityStreak: otherUser.activityStreak,
      sessionsPlayed: otherUser.sessionsPlayed,
    };
  });

  const presenceMap = await getPresenceMap(normalizedSessions.map((session) => session.otherUserId));

  return normalizedSessions.map((session) => ({
    ...session,
    positiveRatings: Number(session.positiveRatings ?? 0),
    negativeRatings: Number(session.negativeRatings ?? 0),
    reliabilityScore: computeReliabilityScore(session),
    badges: getTrustBadges(session),
    presence:
      presenceMap.get(session.otherUserId) ?? {
        onlineStatus: "Offline" as const,
        currentlyPlaying: null,
        lastActiveAt: null,
      },
  }));
}

export async function getUserTrustMap(userIds: string[]) {
  await ensureEngagementSchema();

  const safeUserIds = userIds.filter(
    (userId): userId is string => typeof userId === "string" && userId.length > 0
  );

  if (!safeUserIds.length) {
    return new Map<string, { reliabilityScore: number; badges: string[]; positiveRatings: number; negativeRatings: number; activeDays: number; activityStreak: number; sessionsPlayed: number }>();
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: safeUserIds } },
    select: {
      id: true,
      positiveRatings: true,
      negativeRatings: true,
      activeDays: true,
      activityStreak: true,
      sessionsPlayed: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.id,
      {
        positiveRatings: Number(row.positiveRatings ?? 0),
        negativeRatings: Number(row.negativeRatings ?? 0),
        activeDays: Number(row.activeDays ?? 0),
        activityStreak: Number(row.activityStreak ?? 0),
        sessionsPlayed: Number(row.sessionsPlayed ?? 0),
        reliabilityScore: computeReliabilityScore(row),
        badges: getTrustBadges(row),
      },
    ])
  );
}

export async function getPersonalizedSections(viewerId: string) {
  await ensureEngagementSchema();

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    include: { gameProfiles: { include: { game: true } } },
  });

  if (!viewer) {
    return {
      bestMatches: [],
      rankOnline: [],
      recentInGames: [],
      playedWellWith: [],
    };
  }

  const primaryGame = viewer.gameProfiles[0];
  const bestMatches = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      accountStatus: "ACTIVE",
      onboardingCompleted: true,
      gameProfiles: primaryGame
        ? { some: { gameId: primaryGame.gameId } }
        : undefined,
    },
    select: {
      id: true,
      username: true,
      region: true,
    },
    take: 4,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const rankOnline = primaryGame
    ? await prisma.user.findMany({
        where: {
          id: { not: viewerId },
          accountStatus: "ACTIVE",
          onboardingCompleted: true,
          onlineStatus: "Online",
          gameProfiles: {
            some: {
              gameId: primaryGame.gameId,
              rankLabel: primaryGame.rankLabel,
            },
          },
        },
        select: {
          id: true,
          username: true,
          region: true,
        },
        take: 4,
      })
    : [];

  const viewerGameIds = viewer.gameProfiles.map((profile) => profile.gameId);
  const recentInGames = viewerGameIds.length
    ? await prisma.user.findMany({
        where: {
          id: { not: viewerId },
          accountStatus: "ACTIVE",
          onboardingCompleted: true,
          gameProfiles: { some: { gameId: { in: viewerGameIds } } },
        },
        select: {
          id: true,
          username: true,
          region: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      })
    : [];

  const positiveRatings = await prisma.teammateRating.findMany({
    where: {
      raterId: viewerId,
      value: 1,
    },
    select: {
      sessionId: true,
    },
  });

  const ratedSessions = positiveRatings.length
    ? await prisma.playSession.findMany({
        where: {
          id: { in: positiveRatings.map((rating) => rating.sessionId) },
        },
        select: {
          id: true,
          userAId: true,
          userBId: true,
        },
      })
    : [];

  const sessionMap = new Map(ratedSessions.map((session) => [session.id, session] as const));
  const playedWellWithCounts = new Map<string, number>();
  for (const rating of positiveRatings) {
    const session = sessionMap.get(rating.sessionId);
    if (!session) {
      continue;
    }
    const otherUserId =
      session.userAId === viewerId ? session.userBId : session.userAId;
    if (!otherUserId) {
      continue;
    }
    playedWellWithCounts.set(otherUserId, (playedWellWithCounts.get(otherUserId) ?? 0) + 1);
  }

  const playedWellWithIds = Array.from(playedWellWithCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([otherUserId]) => otherUserId)
    .filter((userId): userId is string => typeof userId === "string" && userId.length > 0);

  const playedWellWithUsers = playedWellWithIds.length
    ? await prisma.user.findMany({
        where: { id: { in: playedWellWithIds } },
        select: {
          id: true,
          username: true,
          region: true,
        },
      })
    : [];

  const trustMap = await getUserTrustMap([
    ...bestMatches.map((user) => user.id),
    ...rankOnline.map((user) => user.id),
    ...recentInGames.map((user) => user.id),
    ...playedWellWithUsers.map((user) => user.id),
  ]);

  function decorate<T extends { id: string; username: string; region: string | null }>(items: T[]) {
    return items.map((item) => ({
      ...item,
      ...(trustMap.get(item.id) ?? {
        reliabilityScore: 65,
        badges: [] as string[],
        positiveRatings: 0,
        negativeRatings: 0,
        activeDays: 0,
        activityStreak: 0,
        sessionsPlayed: 0,
      }),
    }));
  }

  return {
    bestMatches: decorate(bestMatches),
    rankOnline: decorate(rankOnline),
    recentInGames: decorate(recentInGames),
    playedWellWith: decorate(playedWellWithUsers),
  };
}

export async function refreshEngagementNotifications(userId: string) {
  await ensureEngagementSchema();

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameProfiles: true },
  });
  if (!viewer) return;

  const primaryProfile = viewer.gameProfiles[0];
  if (primaryProfile) {
    const total = await prisma.user.count({
      where: {
        id: { not: userId },
        accountStatus: "ACTIVE",
        lookingForGroup: true,
        isLookingNow: true,
        onlineStatus: "Online",
        gameProfiles: {
          some: {
            gameId: primaryProfile.gameId,
            rankLabel: primaryProfile.rankLabel,
          },
        },
      },
    });
    const body = `${total} players in your rank are queueing now.`;
    if (total >= 3 && !(await hasRecentNotification(userId, "RANK_QUEUE", body, 2))) {
      await createNotification({
        userId,
        type: "RANK_QUEUE",
        title: "Your rank is active right now",
        body,
        link: "/discover",
      });
    }
  }

  const recent = await getRecentlyPlayedWith(userId);
  const onlineTeammate = recent.find((entry) => entry.presence.onlineStatus === "Online");
  if (onlineTeammate) {
    const body = `${onlineTeammate.otherUsername} is online again.`;
    if (!(await hasRecentNotification(userId, "TEAMMATE_ONLINE", body, 4))) {
      await createNotification({
        userId,
        type: "TEAMMATE_ONLINE",
        title: "A previous teammate is back online",
        body,
        link: onlineTeammate.matchId ? `/messages?match=${onlineTeammate.matchId}` : "/discover",
      });
    }
  }
}

export async function getAnalyticsSummary() {
  await ensureEngagementSchema();

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    _count: {
      type: true,
    },
  });

  return Object.fromEntries(rows.map((row) => [row.type, Number(row._count.type)]));
}
