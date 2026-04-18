"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { touchUserActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/auth";
import { getRankOptionsForGame } from "@/lib/config/catalog";

function uniqueValues(values: FormDataEntryValue[]) {
  return Array.from(new Set(values.map((value) => String(value)).filter(Boolean)));
}

export async function saveProfileAction(formData: FormData) {
  const viewer = await requireViewer();

  const username = String(formData.get("username") || "").trim();
  const ageValue = String(formData.get("age") || "").trim();
  const age = ageValue ? Number(ageValue) : null;

  await prisma.user.update({
    where: { id: viewer.id },
    data: {
      username,
      age,
      region: String(formData.get("region") || ""),
      timezone: String(formData.get("timezone") || ""),
      bio: String(formData.get("bio") || ""),
      image: String(formData.get("image") || ""),
      discordHandle: String(formData.get("discordHandle") || ""),
      partyLink: String(formData.get("partyLink") || ""),
      onlineStatus: String(formData.get("onlineStatus") || "Online"),
      lookingForGroup: formData.get("lookingForGroup") === "on",
      onboardingCompleted: true,
    },
  });

  await touchUserActivity(viewer.id, {
    onlineStatus:
      (String(formData.get("onlineStatus") || "Online") as "Online" | "Away" | "Offline"),
    currentlyPlaying: String(formData.get("currentlyPlaying") || "").trim() || null,
  });

  await prisma.userLanguage.deleteMany({ where: { userId: viewer.id } });
  await prisma.userPlaystyle.deleteMany({ where: { userId: viewer.id } });
  await prisma.userPlayTime.deleteMany({ where: { userId: viewer.id } });
  await prisma.userGameProfile.deleteMany({ where: { userId: viewer.id } });

  const languages = uniqueValues(formData.getAll("languages"));
  const playstyles = uniqueValues(formData.getAll("playstyles"));
  const playTimes = uniqueValues(formData.getAll("playTimes"));

  if (languages.length) {
    await prisma.userLanguage.createMany({
      data: languages.map((language) => ({ userId: viewer.id, language })),
    });
  }

  if (playstyles.length) {
    await prisma.userPlaystyle.createMany({
      data: playstyles.map((tag) => ({ userId: viewer.id, tag })),
    });
  }

  if (playTimes.length) {
    await prisma.userPlayTime.createMany({
      data: playTimes.map((label) => ({ userId: viewer.id, label })),
    });
  }

  const selectedGames = uniqueValues(formData.getAll("selectedGames"));

  for (const slug of selectedGames) {
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) continue;

    const requestedRank = String(formData.get(`rank_${slug}`) || "Unranked");
    const rankOptions = getRankOptionsForGame(slug);
    const rankLabel = rankOptions.includes(requestedRank) ? requestedRank : "Unranked";

    await prisma.userGameProfile.create({
      data: {
        userId: viewer.id,
        gameId: game.id,
        rankLabel,
      },
    });
  }

  revalidatePath("/discover");
  revalidatePath("/search");
  revalidatePath("/profile");
  redirect("/discover");
}

export async function updateSettingsAction(formData: FormData) {
  const viewer = await requireViewer();

  await prisma.user.update({
    where: { id: viewer.id },
    data: {
      lookingForGroup: formData.get("lookingForGroup") === "on",
      onlineStatus: String(formData.get("onlineStatus") || "Online"),
      discordHandle: String(formData.get("discordHandle") || ""),
      partyLink: String(formData.get("partyLink") || ""),
    },
  });

  await touchUserActivity(viewer.id, {
    onlineStatus:
      (String(formData.get("onlineStatus") || "Online") as "Online" | "Away" | "Offline"),
    currentlyPlaying: String(formData.get("currentlyPlaying") || "").trim() || null,
  });

  revalidatePath("/settings");
  revalidatePath("/discover");
}
