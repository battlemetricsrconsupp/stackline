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

  await prisma.$executeRaw`
    INSERT INTO "AnalyticsEvent" ("id", "type", "userId", "metadata")
    VALUES (
      ${randomUUID()},
      ${type},
      ${userId ?? null},
      ${metadata ? JSON.stringify(metadata) : null}
    )
  `;
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  await ensureEngagementSchema();

  await prisma.$executeRaw`
    INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "link")
    VALUES (
      ${randomUUID()},
      ${input.userId},
      ${input.type},
      ${input.title},
      ${input.body},
      ${input.link ?? null}
    )
  `;
}

async function hasRecentNotification(userId: string, type: string, bodyLike: string, hours: number) {
  const rows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) as total
    FROM "Notification"
    WHERE "userId" = ${userId}
      AND "type" = ${type}
      AND "body" = ${bodyLike}
      AND "createdAt" >= NOW() - (${hours} * INTERVAL '1 hour')
  `;

  return Number(rows[0]?.total ?? 0) > 0;
}

export async function listNotifications(userId: string) {
  await ensureEngagementSchema();

  return prisma.$queryRaw<Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    isRead: number;
    createdAt: Date;
  }>>`
    SELECT
      "id" as id,
      "type" as type,
      "title" as title,
      "body" as body,
      "link" as link,
      "isRead" as isRead,
      "createdAt" as createdAt
    FROM "Notification"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 12
  `;
}

export async function markNotificationsRead(userId: string) {
  await ensureEngagementSchema();

  await prisma.$executeRaw`
    UPDATE "Notification"
    SET "isRead" = true
    WHERE "userId" = ${userId}
      AND "isRead" = false
  `;
}

export async function createPlaySessionFromInvite(input: {
  inviteId: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  gameSlug?: string | null;
}) {
  await ensureEngagementSchema();

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" as id
    FROM "PlaySession"
    WHERE "playInviteId" = ${input.inviteId}
    LIMIT 1
  `;

  if (existing[0]?.id) {
    return existing[0].id;
  }

  const sessionId = randomUUID();
  const promptAfter = new Date(Date.now() + 45 * 60_000).toISOString();
  const [userAId, userBId] = [input.senderId, input.receiverId].sort();

  await prisma.$executeRaw`
    INSERT INTO "PlaySession" (
      "id",
      "playInviteId",
      "matchId",
      "userAId",
      "userBId",
      "initiatorId",
      "gameSlug",
      "promptAfterAt"
    )
    VALUES (
      ${sessionId},
      ${input.inviteId},
      ${input.matchId},
      ${userAId},
      ${userBId},
      ${input.senderId},
      ${input.gameSlug ?? null},
      ${promptAfter}
    )
  `;

  await prisma.$executeRaw`
    UPDATE "User"
    SET "sessionsPlayed" = COALESCE("sessionsPlayed", 0) + 1
    WHERE "id" IN (${input.senderId}, ${input.receiverId})
  `;

  await trackAnalyticsEvent("session_started", input.senderId, {
    receiverId: input.receiverId,
    gameSlug: input.gameSlug ?? null,
  });

  return sessionId;
}

async function recalculateUserRatings(userId: string) {
  const rows = await prisma.$queryRaw<Array<{ positive: number; negative: number }>>`
    SELECT
      SUM(CASE WHEN "value" = 1 THEN 1 ELSE 0 END) as positive,
      SUM(CASE WHEN "value" = -1 THEN 1 ELSE 0 END) as negative
    FROM "TeammateRating"
    WHERE "ratedUserId" = ${userId}
  `;

  await prisma.$executeRaw`
    UPDATE "User"
    SET "positiveRatings" = ${Number(rows[0]?.positive ?? 0)},
        "negativeRatings" = ${Number(rows[0]?.negative ?? 0)}
    WHERE "id" = ${userId}
  `;
}

export async function submitTeammateRating(input: {
  sessionId: string;
  raterId: string;
  positive: boolean;
  note?: string | null;
}) {
  await ensureEngagementSchema();

  const sessions = await prisma.$queryRaw<Array<{
    id: string;
    userAId: string;
    userBId: string;
    status: SessionStatus;
  }>>`
    SELECT "id", "userAId", "userBId", "status"
    FROM "PlaySession"
    WHERE "id" = ${input.sessionId}
    LIMIT 1
  `;

  const session = sessions[0];
  if (!session) {
    return null;
  }

  const ratedUserId =
    session.userAId === input.raterId ? session.userBId : session.userAId;

  await prisma.$executeRaw`
    INSERT INTO "TeammateRating" ("id", "sessionId", "raterId", "ratedUserId", "value", "note")
    VALUES (
      ${randomUUID()},
      ${input.sessionId},
      ${input.raterId},
      ${ratedUserId},
      ${input.positive ? 1 : -1},
      ${input.note ?? null}
    )
    ON CONFLICT("sessionId", "raterId")
    DO UPDATE SET
      "value" = excluded."value",
      "note" = excluded."note",
      "createdAt" = CURRENT_TIMESTAMP
  `;

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

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    matchId: string | null;
    gameSlug: string | null;
    status: SessionStatus;
    startedAt: Date;
    promptAfterAt: Date;
    userAId: string;
    userBId: string;
    initiatorId: string;
    otherUsername: string;
    alreadyRated: number;
    alreadyConfirmed: string | null;
  }>>`
    SELECT
      ps."id" as id,
      ps."matchId" as matchId,
      ps."gameSlug" as gameSlug,
      ps."status" as status,
      ps."startedAt" as startedAt,
      ps."promptAfterAt" as promptAfterAt,
      ps."userAId" as userAId,
      ps."userBId" as userBId,
      ps."initiatorId" as initiatorId,
      CASE WHEN ps."userAId" = ${userId} THEN ub."username" ELSE ua."username" END as otherUsername,
      (
        SELECT COUNT(*)
        FROM "TeammateRating" tr
        WHERE tr."sessionId" = ps."id"
          AND tr."raterId" = ${userId}
      ) as alreadyRated,
      CASE
        WHEN ps."userAId" = ${userId} THEN ps."userAConfirmedAt"
        ELSE ps."userBConfirmedAt"
      END as alreadyConfirmed
    FROM "PlaySession" ps
    JOIN "User" ua ON ua."id" = ps."userAId"
    JOIN "User" ub ON ub."id" = ps."userBId"
    WHERE (ps."userAId" = ${userId} OR ps."userBId" = ${userId})
      AND ps."promptAfterAt" <= NOW()
      AND (
        ps."status" = 'PENDING'
        OR (ps."status" = 'COMPLETED' AND (
          SELECT COUNT(*)
          FROM "TeammateRating" tr
          WHERE tr."sessionId" = ps."id"
            AND tr."raterId" = ${userId}
        ) = 0)
      )
    ORDER BY ps."startedAt" DESC
    LIMIT 3
  `;

  return rows;
}

export async function respondToSessionPrompt(input: {
  sessionId: string;
  userId: string;
  played: boolean;
}) {
  await ensureEngagementSchema();

  const sessions = await prisma.$queryRaw<Array<{
    id: string;
    userAId: string;
    userBId: string;
    matchId: string | null;
    status: SessionStatus;
  }>>`
    SELECT "id", "userAId", "userBId", "matchId", "status"
    FROM "PlaySession"
    WHERE "id" = ${input.sessionId}
    LIMIT 1
  `;
  const session = sessions[0];
  if (!session) return null;

  const otherUserId = session.userAId === input.userId ? session.userBId : session.userAId;
  if (session.userAId === input.userId) {
    await prisma.$executeRaw`
      UPDATE "PlaySession"
      SET "userAConfirmedAt" = CURRENT_TIMESTAMP,
          "status" = ${input.played ? "COMPLETED" : "NO_SHOW"},
          "completedAt" = CASE
            WHEN ${input.played ? "COMPLETED" : "NO_SHOW"} = 'COMPLETED' THEN CURRENT_TIMESTAMP
            ELSE "completedAt"
          END
      WHERE "id" = ${input.sessionId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "PlaySession"
      SET "userBConfirmedAt" = CURRENT_TIMESTAMP,
          "status" = ${input.played ? "COMPLETED" : "NO_SHOW"},
          "completedAt" = CASE
            WHEN ${input.played ? "COMPLETED" : "NO_SHOW"} = 'COMPLETED' THEN CURRENT_TIMESTAMP
            ELSE "completedAt"
          END
      WHERE "id" = ${input.sessionId}
    `;
  }

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

  const sessions = await prisma.$queryRaw<Array<{
    sessionId: string;
    matchId: string | null;
    startedAt: Date;
    otherUserId: string;
    otherUsername: string;
    otherRegion: string | null;
    gameSlug: string | null;
    positiveRatings: number | null;
    negativeRatings: number | null;
    activeDays: number | null;
    activityStreak: number | null;
    sessionsPlayed: number | null;
  }>>`
    SELECT
      ps."id" as sessionId,
      ps."matchId" as matchId,
      ps."startedAt" as startedAt,
      CASE WHEN ps."userAId" = ${userId} THEN ps."userBId" ELSE ps."userAId" END as otherUserId,
      CASE WHEN ps."userAId" = ${userId} THEN ub."username" ELSE ua."username" END as otherUsername,
      CASE WHEN ps."userAId" = ${userId} THEN ub."region" ELSE ua."region" END as otherRegion,
      ps."gameSlug" as gameSlug,
      CASE WHEN ps."userAId" = ${userId} THEN ub."positiveRatings" ELSE ua."positiveRatings" END as positiveRatings,
      CASE WHEN ps."userAId" = ${userId} THEN ub."negativeRatings" ELSE ua."negativeRatings" END as negativeRatings,
      CASE WHEN ps."userAId" = ${userId} THEN ub."activeDays" ELSE ua."activeDays" END as activeDays,
      CASE WHEN ps."userAId" = ${userId} THEN ub."activityStreak" ELSE ua."activityStreak" END as activityStreak,
      CASE WHEN ps."userAId" = ${userId} THEN ub."sessionsPlayed" ELSE ua."sessionsPlayed" END as sessionsPlayed
    FROM "PlaySession" ps
    JOIN "User" ua ON ua."id" = ps."userAId"
    JOIN "User" ub ON ub."id" = ps."userBId"
    WHERE (ps."userAId" = ${userId} OR ps."userBId" = ${userId})
      AND ps."status" = 'COMPLETED'
    ORDER BY ps."startedAt" DESC
    LIMIT 6
  `;

  const presenceMap = await getPresenceMap(sessions.map((session) => session.otherUserId));

  return sessions.map((session) => ({
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

  if (!userIds.length) {
    return new Map<string, { reliabilityScore: number; badges: string[]; positiveRatings: number; negativeRatings: number; activeDays: number; activityStreak: number; sessionsPlayed: number }>();
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
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

  const playedWellWithRows = await prisma.$queryRaw<Array<{
    otherUserId: string;
    positiveRatingsFromViewer: number;
  }>>`
    SELECT
      CASE WHEN ps."userAId" = ${viewerId} THEN ps."userBId" ELSE ps."userAId" END as otherUserId,
      COUNT(*) as positiveRatingsFromViewer
    FROM "PlaySession" ps
    JOIN "TeammateRating" tr ON tr."sessionId" = ps."id"
    WHERE (ps."userAId" = ${viewerId} OR ps."userBId" = ${viewerId})
      AND tr."raterId" = ${viewerId}
      AND tr."value" = 1
    GROUP BY otherUserId
    ORDER BY positiveRatingsFromViewer DESC
    LIMIT 4
  `;

  const playedWellWithUsers = playedWellWithRows.length
    ? await prisma.user.findMany({
        where: { id: { in: playedWellWithRows.map((row) => row.otherUserId) } },
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
    const rows = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*) as total
      FROM "User" u
      JOIN "UserGameProfile" ugp ON ugp."userId" = u."id"
        WHERE u."id" != ${userId}
          AND u."accountStatus" = 'ACTIVE'
          AND u."lookingForGroup" = true
          AND u."isLookingNow" = true
          AND u."onlineStatus" = 'Online'
        AND ugp."gameId" = ${primaryProfile.gameId}
        AND ugp."rankLabel" = ${primaryProfile.rankLabel}
    `;
    const total = Number(rows[0]?.total ?? 0);
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

  const rows = await prisma.$queryRaw<Array<{ type: string; total: number }>>`
    SELECT "type" as type, COUNT(*) as total
    FROM "AnalyticsEvent"
    GROUP BY "type"
  `;

  return Object.fromEntries(rows.map((row) => [row.type, Number(row.total)]));
}
