import "server-only";

import { GAME_CATALOG } from "@/lib/config/catalog";
import { prisma } from "@/lib/prisma";
import {
  formatLastActive,
  getLiveActivitySummary as getLiveActivitySummaryInternal,
  getPresenceMap,
} from "@/lib/activity";
import { computeCompatibilityDetails } from "@/lib/compatibility";
import {
  getPersonalizedSections as getPersonalizedSectionsInternal,
  getUserTrustMap,
} from "@/lib/engagement";
import { getLookingNowMap } from "@/lib/live-queue";
import type { FilterState } from "@/lib/types";

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

function statusPriority(status?: string | null) {
  if (status === "Online") return 3;
  if (status === "Away") return 2;
  return 1;
}

async function getBlockedIdsForUser(userId: string) {
  const blocked = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
  });

  return new Set(blocked.flatMap((entry) => [entry.blockerId, entry.blockedId]));
}

export async function getCatalogData() {
  try {
    const games = await prisma.game.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return games;
  } catch {
    return [...GAME_CATALOG]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((game) => ({
        id: game.slug,
        slug: game.slug,
        name: game.name,
        genre: game.genre ?? null,
        description: null,
        active: true,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }));
  }
}

export async function getDiscoveryFeed(viewerId: string) {
  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    include: userInclude,
  });

  const [blockedIds, likes, matches] = await Promise.all([
    getBlockedIdsForUser(viewerId),
    prisma.like.findMany({
      where: {
        OR: [{ fromUserId: viewerId }, { toUserId: viewerId }],
      },
      select: { fromUserId: true, toUserId: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [{ userAId: viewerId }, { userBId: viewerId }],
      },
      select: { userAId: true, userBId: true },
    }),
  ]);

  blockedIds.add(viewerId);

  const seenIds = new Set<string>();
  for (const like of likes) {
    seenIds.add(like.fromUserId === viewerId ? like.toUserId : like.fromUserId);
  }
  for (const match of matches) {
    seenIds.add(match.userAId === viewerId ? match.userBId : match.userAId);
  }

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(new Set([...blockedIds, ...seenIds])) },
      onboardingCompleted: true,
      lookingForGroup: true,
      accountStatus: "ACTIVE",
    },
    include: userInclude,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const [presenceMap, lookingNowMap, trustMap] = await Promise.all([
    getPresenceMap(candidates.map((candidate) => candidate.id)),
    getLookingNowMap(candidates.map((candidate) => candidate.id)),
    getUserTrustMap(candidates.map((candidate) => candidate.id)),
  ]);

  return candidates
    .map((candidate) => {
      const compatibility = computeCompatibilityDetails(
        {
          age: viewer.age,
          region: viewer.region,
          timezone: viewer.timezone,
          languages: viewer.languages.map((item) => item.language),
          playstyles: viewer.playstyles.map((item) => item.tag),
          playTimes: viewer.playTimes.map((item) => item.label),
          gameProfiles: viewer.gameProfiles.map((item) => ({
            gameId: item.gameId,
            rankLabel: item.rankLabel,
            gameName: item.game.name,
          })),
        },
        {
          age: candidate.age,
          region: candidate.region,
          timezone: candidate.timezone,
          languages: candidate.languages.map((item) => item.language),
          playstyles: candidate.playstyles.map((item) => item.tag),
          playTimes: candidate.playTimes.map((item) => item.label),
          gameProfiles: candidate.gameProfiles.map((item) => ({
            gameId: item.gameId,
            rankLabel: item.rankLabel,
            gameName: item.game.name,
          })),
        }
      );
      const presence =
        presenceMap.get(candidate.id) ?? {
          onlineStatus: "Offline" as const,
          currentlyPlaying: null,
          lastActiveAt: null,
        };

      return {
        ...candidate,
        compatibility: compatibility.score,
        compatibilityReasons: compatibility.reasons,
        presence,
        trust: trustMap.get(candidate.id) ?? {
          reliabilityScore: 65,
          badges: [],
          positiveRatings: 0,
          negativeRatings: 0,
          activeDays: 0,
          activityStreak: 0,
          sessionsPlayed: 0,
        },
        isLookingNow: lookingNowMap.has(candidate.id),
        lookingNowStartedAt: lookingNowMap.get(candidate.id) ?? null,
        lookingNowLabel: lookingNowMap.has(candidate.id)
          ? "Looking for teammates NOW"
          : null,
        lastActiveLabel: formatLastActive(presence.lastActiveAt),
        sortSignals: {
          sharedGameCount: compatibility.sharedGameCount,
          liveQueuePriority: lookingNowMap.has(candidate.id) ? 1 : 0,
          sameRankCount: compatibility.sameRankCount,
          sameRegion: compatibility.sameRegion ? 1 : 0,
          sharedPlaystyleCount: compatibility.sharedPlaystyleCount,
          onlinePriority: statusPriority(presence.onlineStatus),
          lastActiveAt: presence.lastActiveAt?.getTime() ?? 0,
        },
      };
    })
    .sort((a, b) => {
      if (b.sortSignals.sharedGameCount !== a.sortSignals.sharedGameCount) {
        return b.sortSignals.sharedGameCount - a.sortSignals.sharedGameCount;
      }
      if (b.sortSignals.liveQueuePriority !== a.sortSignals.liveQueuePriority) {
        return b.sortSignals.liveQueuePriority - a.sortSignals.liveQueuePriority;
      }
      if (b.sortSignals.sameRankCount !== a.sortSignals.sameRankCount) {
        return b.sortSignals.sameRankCount - a.sortSignals.sameRankCount;
      }
      if (b.sortSignals.sameRegion !== a.sortSignals.sameRegion) {
        return b.sortSignals.sameRegion - a.sortSignals.sameRegion;
      }
      if (b.sortSignals.sharedPlaystyleCount !== a.sortSignals.sharedPlaystyleCount) {
        return b.sortSignals.sharedPlaystyleCount - a.sortSignals.sharedPlaystyleCount;
      }
      if (b.sortSignals.onlinePriority !== a.sortSignals.onlinePriority) {
        return b.sortSignals.onlinePriority - a.sortSignals.onlinePriority;
      }
      if (b.sortSignals.lastActiveAt !== a.sortSignals.lastActiveAt) {
        return b.sortSignals.lastActiveAt - a.sortSignals.lastActiveAt;
      }
      return b.compatibility - a.compatibility;
    });
}

export async function searchPlayers(filter: FilterState, viewerId?: string) {
  const blockedIds = viewerId ? await getBlockedIdsForUser(viewerId) : new Set<string>();
  if (viewerId) {
    blockedIds.add(viewerId);
  }

  const existingMatches = viewerId
    ? await prisma.match.findMany({
        where: {
          status: "MATCHED",
          OR: [{ userAId: viewerId }, { userBId: viewerId }],
        },
        select: { id: true, userAId: true, userBId: true },
      })
    : [];
  const matchByOtherUserId = new Map(
    existingMatches.map((match) => [
      match.userAId === viewerId ? match.userBId : match.userAId,
      match.id,
    ])
  );

  const users = await prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      accountStatus: "ACTIVE",
      lookingForGroup: true,
      ...(blockedIds.size ? { id: { notIn: Array.from(blockedIds) } } : {}),
      ...(filter.region ? { region: filter.region } : {}),
      ...(filter.minAge || filter.maxAge
        ? {
            age: {
              ...(filter.minAge ? { gte: filter.minAge } : {}),
              ...(filter.maxAge ? { lte: filter.maxAge } : {}),
            },
          }
        : {}),
      ...(filter.language
        ? {
            languages: {
              some: {
                language: filter.language,
              },
            },
          }
        : {}),
      ...(filter.playstyle
        ? {
            playstyles: {
              some: {
                tag: filter.playstyle,
              },
            },
          }
        : {}),
      ...(filter.game
        ? {
            gameProfiles: {
              some: {
                game: {
                  slug: filter.game,
                },
                ...(filter.rank ? { rankLabel: filter.rank } : {}),
              },
            },
          }
        : filter.rank
          ? {
              gameProfiles: {
                some: {
                  rankLabel: filter.rank,
                },
              },
            }
          : {}),
    },
    include: userInclude,
    orderBy: { updatedAt: "desc" },
  });

  const [presenceMap, trustMap] = await Promise.all([
    getPresenceMap(users.map((user) => user.id)),
    getUserTrustMap(users.map((user) => user.id)),
  ]);

  return users
    .map((user) => {
      const presence =
        presenceMap.get(user.id) ?? {
          onlineStatus: "Offline" as const,
          currentlyPlaying: null,
          lastActiveAt: null,
        };

      return {
        ...user,
        presence,
        lastActiveLabel: formatLastActive(presence.lastActiveAt),
        matchId: matchByOtherUserId.get(user.id) ?? null,
        trust: trustMap.get(user.id) ?? {
          reliabilityScore: 65,
          badges: [],
          positiveRatings: 0,
          negativeRatings: 0,
          activeDays: 0,
          activityStreak: 0,
          sessionsPlayed: 0,
        },
      };
    })
    .sort((a, b) => {
      const onlineDiff =
        statusPriority(b.presence.onlineStatus) - statusPriority(a.presence.onlineStatus);
      if (onlineDiff !== 0) return onlineDiff;

      return (b.presence.lastActiveAt?.getTime() ?? 0) - (a.presence.lastActiveAt?.getTime() ?? 0);
    });
}

export async function getMatchesForUser(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      status: "MATCHED",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { include: userInclude },
      userB: { include: userInclude },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const otherUserIds = matches.map((match) =>
    match.userAId === userId ? match.userBId : match.userAId
  );
  const [presenceMap, trustMap] = await Promise.all([
    getPresenceMap(otherUserIds),
    getUserTrustMap(otherUserIds),
  ]);

  return matches.map((match) => {
    const otherUser = match.userAId === userId ? match.userB : match.userA;
    const lastMessage = match.messages.at(-1) ?? null;
    const presence =
      presenceMap.get(otherUser.id) ?? {
        onlineStatus: "Offline" as const,
        currentlyPlaying: null,
        lastActiveAt: null,
      };
    return {
      ...match,
      otherUser: {
        ...otherUser,
        presence,
        lastActiveLabel: formatLastActive(presence.lastActiveAt),
        trust: trustMap.get(otherUser.id) ?? {
          reliabilityScore: 65,
          badges: [],
          positiveRatings: 0,
          negativeRatings: 0,
          activeDays: 0,
          activityStreak: 0,
          sessionsPlayed: 0,
        },
      },
      lastMessage,
    };
  });
}

export async function getDashboardStats() {
  const [users, games, matches, reports] = await Promise.all([
    prisma.user.count(),
    prisma.game.count(),
    prisma.match.count({ where: { status: "MATCHED" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return { users, games, matches, reports };
}

export async function getLiveActivitySummary() {
  return getLiveActivitySummaryInternal();
}

export async function getPersonalizedSections(viewerId: string) {
  return getPersonalizedSectionsInternal(viewerId);
}
