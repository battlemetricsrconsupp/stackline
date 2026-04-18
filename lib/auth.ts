import "server-only";

import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { redirect } from "next/navigation";
import { touchUserActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { getStoredRoleForUser } from "@/lib/roles";
import {
  clearSessionCookie,
  getCookieSession,
  SESSION_MAX_AGE_SECONDS,
  setSessionCookie,
} from "@/lib/session";

function getSessionExpiryDate() {
  return addDays(new Date(), SESSION_MAX_AGE_SECONDS / (60 * 60 * 24));
}

async function createSessionForUser(userId: string) {
  const token = await setSessionCookie();

  await prisma.session.deleteMany({
    where: {
      OR: [{ userId, expiresAt: { lt: new Date() } }, { token }],
    },
  });

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: getSessionExpiryDate(),
    },
  });

  return token;
}

export async function createUserAccount(input: {
  email: string;
  username: string;
  password: string;
  age?: number | null;
  region?: string;
  timezone?: string;
  languages?: string[];
  playstyles?: string[];
  selectedGames?: string[];
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      username: input.username,
      passwordHash,
      age: input.age ?? null,
      region: input.region ?? null,
      timezone: input.timezone ?? null,
    },
  });

  if (input.languages?.length) {
    await prisma.userLanguage.createMany({
      data: input.languages.map((language) => ({
        userId: user.id,
        language,
      })),
    });
  }

  if (input.playstyles?.length) {
    await prisma.userPlaystyle.createMany({
      data: input.playstyles.map((tag) => ({
        userId: user.id,
        tag,
      })),
    });
  }

  if (input.selectedGames?.length) {
    const games = await prisma.game.findMany({
      where: { slug: { in: input.selectedGames } },
      select: { id: true },
    });

    if (games.length) {
      await prisma.userGameProfile.createMany({
        data: games.map((game) => ({
          userId: user.id,
          gameId: game.id,
          rankLabel: "Unranked",
        })),
      });
    }
  }

  await createSessionForUser(user.id);
  await touchUserActivity(user.id, { onlineStatus: "Online" });

  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  if (user.accountStatus !== "ACTIVE") {
    return { ...user, blockedFromLogin: true } as const;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  await createSessionForUser(user.id);
  await touchUserActivity(user.id, { onlineStatus: "Online" });

  return user;
}

export async function logoutUser() {
  const cookieSession = await getCookieSession();
  if (cookieSession?.token) {
    await prisma.session.deleteMany({
      where: { token: cookieSession.token },
    });
  }
  await clearSessionCookie();
}

export async function getViewer() {
  const cookieSession = await getCookieSession();
  if (!cookieSession?.token) return null;

  const session = await prisma.session.findUnique({
    where: { token: cookieSession.token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (cookieSession.token) {
      await prisma.session.deleteMany({
        where: { token: cookieSession.token },
      });
    }
    await clearSessionCookie();
    return null;
  }

  if (session.user.accountStatus !== "ACTIVE") {
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });
    await clearSessionCookie();
    return null;
  }

  const role = await getStoredRoleForUser(session.user.id);
  await touchUserActivity(session.user.id);

  return {
    ...session.user,
    role,
  };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }

  return viewer;
}
