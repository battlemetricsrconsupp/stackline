import "server-only";

import { prisma } from "@/lib/prisma";

export type PresenceStatus = "Online" | "Away" | "Offline";

export type PresenceInfo = {
  onlineStatus: PresenceStatus;
  currentlyPlaying: string | null;
  lastActiveAt: Date | null;
};

export type LiveActivitySummary = {
  onlineCount: number;
  awayCount: number;
  perGame: Array<{
    gameName: string;
    total: number;
  }>;
};

export async function ensurePresenceColumns() {
  return;
}

function normalizePresenceStatus(status?: string | null): PresenceStatus {
  if (status === "Away" || status === "Offline") {
    return status;
  }

  return "Online";
}

export async function getPresenceMap(userIds: string[]): Promise<Map<string, PresenceInfo>> {
  if (!userIds.length) {
    return new Map<string, PresenceInfo>();
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      onlineStatus: true,
      currentlyPlaying: true,
      lastActiveAt: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.id,
      {
        onlineStatus: normalizePresenceStatus(row.onlineStatus),
        currentlyPlaying: row.currentlyPlaying,
        lastActiveAt: row.lastActiveAt,
      },
    ])
  );
}

export async function getPresenceForUser(userId: string): Promise<PresenceInfo> {
  const presenceMap = await getPresenceMap([userId]);
  return (
    presenceMap.get(userId) ?? {
      onlineStatus: "Offline",
      currentlyPlaying: null,
      lastActiveAt: null,
    }
  );
}

export async function touchUserActivity(
  userId: string,
  input?: {
    onlineStatus?: PresenceStatus;
    currentlyPlaying?: string | null;
  }
) {
  const today = new Date().toISOString().slice(0, 10);
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeDays: true,
      activityStreak: true,
      lastActiveDate: true,
    },
  });

  if (!current) {
    return;
  }

  let nextActiveDays = Number(current.activeDays ?? 0);
  let nextActivityStreak = Number(current.activityStreak ?? 0);

  if (current.lastActiveDate !== today) {
    nextActiveDays += 1;
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    nextActivityStreak = current.lastActiveDate === yesterday ? nextActivityStreak + 1 : 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveAt: new Date(),
      ...(input?.onlineStatus !== undefined ? { onlineStatus: input.onlineStatus } : {}),
      ...(input?.currentlyPlaying !== undefined
        ? { currentlyPlaying: input.currentlyPlaying }
        : {}),
      activeDays: nextActiveDays,
      activityStreak: nextActivityStreak,
      lastActiveDate: today,
    },
  });
}

export function formatLastActive(lastActiveAt: Date | null) {
  if (!lastActiveAt) return "Active recently";

  const diffMs = Date.now() - lastActiveAt.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `Active ${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Active ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

export async function getLiveActivitySummary(): Promise<LiveActivitySummary> {
  try {
    const [onlineCount, awayCount, onlineUsers] = await Promise.all([
      prisma.user.count({
        where: {
          accountStatus: "ACTIVE",
          onboardingCompleted: true,
          lookingForGroup: true,
          onlineStatus: "Online",
        },
      }),
      prisma.user.count({
        where: {
          accountStatus: "ACTIVE",
          onboardingCompleted: true,
          lookingForGroup: true,
          onlineStatus: "Away",
        },
      }),
      prisma.user.findMany({
        where: {
          accountStatus: "ACTIVE",
          onboardingCompleted: true,
          lookingForGroup: true,
          onlineStatus: "Online",
        },
        select: {
          gameProfiles: {
            select: {
              game: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const perGameCounts = new Map<string, number>();
    for (const user of onlineUsers) {
      const seenGames = new Set<string>();
      for (const profile of user.gameProfiles) {
        const gameName = profile.game.name;
        if (seenGames.has(gameName)) {
          continue;
        }
        seenGames.add(gameName);
        perGameCounts.set(gameName, (perGameCounts.get(gameName) ?? 0) + 1);
      }
    }

    return {
      onlineCount,
      awayCount,
      perGame: Array.from(perGameCounts.entries())
        .map(([gameName, total]) => ({
          gameName,
          total,
        }))
        .sort((a, b) => b.total - a.total || a.gameName.localeCompare(b.gameName))
        .slice(0, 4),
    };
  } catch {
    return {
      onlineCount: 0,
      awayCount: 0,
      perGame: [],
    };
  }
}
