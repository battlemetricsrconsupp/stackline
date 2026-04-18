import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { GAME_CATALOG } from "../lib/config/catalog";
import { prisma } from "../lib/prisma";

const OWNER_EMAILS = [
  "nova@stackline.gg",
  "miko@stackline.gg",
  "sage@stackline.gg",
] as const;

const LIVE_QUEUE_EMAILS = new Set([
  "nova@stackline.gg",
  "orbit@stackline.gg",
  "neonvandal@stackline.gg",
  "entryluna@stackline.gg",
  "retakejay@stackline.gg",
  "tapstrafetom@stackline.gg",
  "clutchhazel@stackline.gg",
]);

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "Stackline!Local2026";

type DemoUser = {
  email: string;
  username: string;
  age: number;
  region: string;
  timezone: string;
  bio: string;
  image: string;
  discordHandle: string;
  partyLink: string;
  onlineStatus: "Online" | "Away" | "Offline";
  currentlyPlaying: string | null;
  lastActiveMinutesAgo: number;
  languages: string[];
  playstyles: string[];
  playTimes: string[];
  gameProfiles: Array<[string, string]>;
};

const demoUsers: DemoUser[] = [
  {
    email: "nova@stackline.gg",
    username: "NovaPulse",
    age: 22,
    region: "Europe West",
    timezone: "Europe/Oslo",
    bio: "IGL energy, positive comms, and ranked grind nights after work.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "novapulse",
    partyLink: "discord.gg/stackline",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 1,
    languages: ["English", "Norwegian"],
    playstyles: ["Competitive", "Mic Required", "Shotcaller"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["valorant", "Ascendant 2"],
      ["marvel-rivals", "Platinum I"],
      ["overwatch-2", "Platinum 2"],
    ],
  },
  {
    email: "miko@stackline.gg",
    username: "MikoRush",
    age: 25,
    region: "North America",
    timezone: "America/New_York",
    bio: "Fast queues, fast vibes. Looking for reliable duos for Apex and Warzone.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "mikorush",
    partyLink: "discord.gg/rush",
    onlineStatus: "Online",
    currentlyPlaying: "Apex Legends",
    lastActiveMinutesAgo: 3,
    languages: ["English", "Spanish"],
    playstyles: ["Competitive", "Late Night", "Rank Grind"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["apex-legends", "Diamond IV"],
      ["call-of-duty-warzone", "Platinum III"],
      ["fortnite", "Gold III"],
    ],
  },
  {
    email: "sage@stackline.gg",
    username: "SageBloom",
    age: 20,
    region: "Europe Nordic",
    timezone: "Europe/Stockholm",
    bio: "Casual first, clutch second. Love cozy co-op and no-tilt sessions.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "sagebloom",
    partyLink: "discord.gg/chillparty",
    onlineStatus: "Away",
    currentlyPlaying: null,
    lastActiveMinutesAgo: 12,
    languages: ["English", "Swedish"],
    playstyles: ["Chill", "Casual", "Beginner Friendly"],
    playTimes: ["Weekend mornings", "Flexible"],
    gameProfiles: [
      ["minecraft", "Unranked"],
      ["rocket-league", "Gold II"],
      ["dead-by-daylight", "Silver II"],
    ],
  },
  {
    email: "orbit@stackline.gg",
    username: "OrbitLock",
    age: 24,
    region: "Europe West",
    timezone: "Europe/Berlin",
    bio: "Anchor player in tac shooters. Looking for consistent ranked teammates with good comms.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "orbitlock",
    partyLink: "discord.gg/orbitlock",
    onlineStatus: "Online",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 2,
    languages: ["English", "German"],
    playstyles: ["Competitive", "Mic Required", "Rank Grind"],
    playTimes: ["Weekday evenings", "Late nights"],
    gameProfiles: [
      ["counter-strike-2", "15,000-19,999 CS Rating"],
      ["valorant", "Diamond 3"],
      ["rainbow-six-siege", "Platinum I"],
    ],
  },
  {
    email: "lunar@stackline.gg",
    username: "LunarKite",
    age: 21,
    region: "North America",
    timezone: "America/Chicago",
    bio: "Fast learner, good vibes, and always down to queue one more if the team energy is right.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "lunarkite",
    partyLink: "discord.gg/lunarkite",
    onlineStatus: "Online",
    currentlyPlaying: "Fortnite",
    lastActiveMinutesAgo: 4,
    languages: ["English"],
    playstyles: ["Chill", "Competitive", "Mic Required"],
    playTimes: ["Weekend evenings", "Flexible"],
    gameProfiles: [
      ["fortnite", "Platinum I"],
      ["marvel-rivals", "Gold II"],
      ["overwatch-2", "Gold 1"],
    ],
  },
  {
    email: "brick@stackline.gg",
    username: "BrickMode",
    age: 27,
    region: "North America",
    timezone: "America/Los_Angeles",
    bio: "I play support roles, keep comms clean, and prefer zero toxicity.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "brickmode",
    partyLink: "discord.gg/brickmode",
    onlineStatus: "Away",
    currentlyPlaying: "Minecraft",
    lastActiveMinutesAgo: 16,
    languages: ["English", "Spanish"],
    playstyles: ["Casual", "Chill", "Beginner Friendly"],
    playTimes: ["Weekend mornings", "Weekend evenings"],
    gameProfiles: [
      ["destiny-2", "Gold"],
      ["minecraft", "Unranked"],
      ["rocket-league", "Silver III"],
    ],
  },
  {
    email: "vex@stackline.gg",
    username: "VexShot",
    age: 23,
    region: "Europe Nordic",
    timezone: "Europe/Helsinki",
    bio: "Aggro entry player. Looking for a stack that actually wants to improve together.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "vexshot",
    partyLink: "discord.gg/vexshot",
    onlineStatus: "Online",
    currentlyPlaying: "Call of Duty / Warzone",
    lastActiveMinutesAgo: 5,
    languages: ["English", "Swedish"],
    playstyles: ["Tryhard", "Competitive", "Mic Required"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["apex-legends", "Platinum II"],
      ["call-of-duty-warzone", "Diamond I"],
      ["pubg", "Gold II"],
    ],
  },
  {
    email: "ember@stackline.gg",
    username: "EmberQuest",
    age: 29,
    region: "Europe West",
    timezone: "Europe/Paris",
    bio: "MMO and co-op player. Raids, dungeons, survival games, and patient squads only.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "emberquest",
    partyLink: "discord.gg/emberquest",
    onlineStatus: "Away",
    currentlyPlaying: "World of Warcraft",
    lastActiveMinutesAgo: 18,
    languages: ["English", "French"],
    playstyles: ["Casual", "Chill", "Weekend Warrior"],
    playTimes: ["Weekend mornings", "Weekend evenings"],
    gameProfiles: [
      ["world-of-warcraft", "Rival I"],
      ["rust", "Unranked"],
      ["gta-online", "Unranked"],
    ],
  },
  {
    email: "pixel@stackline.gg",
    username: "PixelDrift",
    age: 19,
    region: "Oceania",
    timezone: "Australia/Sydney",
    bio: "Mostly here for fun, but I still want teammates who actually queue up when they say they will.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "pixeldrift",
    partyLink: "discord.gg/pixeldrift",
    onlineStatus: "Online",
    currentlyPlaying: "EA Sports FC",
    lastActiveMinutesAgo: 6,
    languages: ["English"],
    playstyles: ["Chill", "Weekend Warrior", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["ea-sports-fc", "Division 5"],
      ["rocket-league", "Platinum II"],
      ["fortnite", "Silver III"],
    ],
  },
  {
    email: "warden@stackline.gg",
    username: "WardenByte",
    age: 31,
    region: "North America",
    timezone: "America/Toronto",
    bio: "Older gamer, stable schedule, no rage. Prefer adults with clear comms and smart teamwork.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "wardenbyte",
    partyLink: "discord.gg/wardenbyte",
    onlineStatus: "Away",
    currentlyPlaying: null,
    lastActiveMinutesAgo: 24,
    languages: ["English"],
    playstyles: ["Competitive", "Shotcaller", "Weekend Warrior"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["league-of-legends", "Platinum IV"],
      ["dota-2", "Legend III"],
      ["dead-by-daylight", "Gold I"],
    ],
  },
  {
    email: "neonvandal@stackline.gg",
    username: "NeonVandal",
    age: 21,
    region: "Europe West",
    timezone: "Europe/London",
    bio: "Entry frag mentality, clean comms, and I actually queue when I say I will.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "neonvandal",
    partyLink: "discord.gg/neonvandal",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 1,
    languages: ["English"],
    playstyles: ["Competitive", "Mic Required", "Rank Grind"],
    playTimes: ["Weekday evenings", "Late nights"],
    gameProfiles: [
      ["valorant", "Diamond 2"],
      ["counter-strike-2", "10,000-14,999 CS Rating"],
    ],
  },
  {
    email: "pixelsage@stackline.gg",
    username: "PixelSage",
    age: 23,
    region: "Europe West",
    timezone: "Europe/Paris",
    bio: "Support main in hero shooters. IGL if needed, calm if not.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "pixelsage",
    partyLink: "discord.gg/pixelsage",
    onlineStatus: "Online",
    currentlyPlaying: "Overwatch 2",
    lastActiveMinutesAgo: 2,
    languages: ["English", "French"],
    playstyles: ["Competitive", "Chill", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["overwatch-2", "Diamond 3"],
      ["valorant", "Gold 3"],
    ],
  },
  {
    email: "tapstrafetom@stackline.gg",
    username: "TapStrafeTom",
    age: 24,
    region: "North America",
    timezone: "America/Denver",
    bio: "Apex and CS2 grinder. Looking for teammates who play with intent.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "tapstrafetom",
    partyLink: "discord.gg/tapstrafetom",
    onlineStatus: "Online",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 3,
    languages: ["English"],
    playstyles: ["Competitive", "Tryhard", "Mic Required"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["counter-strike-2", "20,000-24,999 CS Rating"],
      ["apex-legends", "Diamond II"],
    ],
  },
  {
    email: "clutchhazel@stackline.gg",
    username: "ClutchHazel",
    age: 20,
    region: "Europe Nordic",
    timezone: "Europe/Copenhagen",
    bio: "Mostly Valorant, always on time, zero ego.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "clutchhazel",
    partyLink: "discord.gg/clutchhazel",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 2,
    languages: ["English", "Danish"],
    playstyles: ["Competitive", "Chill", "Rank Grind"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["valorant", "Platinum 3"],
      ["marvel-rivals", "Gold I"],
    ],
  },
  {
    email: "smokecaller@stackline.gg",
    username: "SmokeCaller",
    age: 26,
    region: "Europe West",
    timezone: "Europe/Berlin",
    bio: "Tac shooter support utility player. You call, I enable.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "smokecaller",
    partyLink: "discord.gg/smokecaller",
    onlineStatus: "Away",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 22,
    languages: ["English", "German"],
    playstyles: ["Competitive", "Shotcaller", "Mic Required"],
    playTimes: ["Weekday evenings", "Flexible"],
    gameProfiles: [
      ["counter-strike-2", "15,000-19,999 CS Rating"],
      ["valorant", "Platinum 1"],
    ],
  },
  {
    email: "entryluna@stackline.gg",
    username: "EntryLuna",
    age: 19,
    region: "North America",
    timezone: "America/New_York",
    bio: "Valorant duos, comp nights, and no dead comms.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "entryluna",
    partyLink: "discord.gg/entryluna",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 1,
    languages: ["English", "Spanish"],
    playstyles: ["Competitive", "Mic Required", "Tryhard"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["valorant", "Ascendant 1"],
      ["fortnite", "Diamond I"],
    ],
  },
  {
    email: "angelpeek@stackline.gg",
    username: "AngelPeek",
    age: 22,
    region: "North America",
    timezone: "America/Chicago",
    bio: "If the vibes are good, I’m down for a five-stack all night.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "angelpeek",
    partyLink: "discord.gg/angelpeek",
    onlineStatus: "Away",
    currentlyPlaying: null,
    lastActiveMinutesAgo: 35,
    languages: ["English"],
    playstyles: ["Chill", "Mic Required", "Weekend Warrior"],
    playTimes: ["Weekend evenings", "Flexible"],
    gameProfiles: [
      ["valorant", "Gold 2"],
      ["rocket-league", "Champion I"],
    ],
  },
  {
    email: "retakejay@stackline.gg",
    username: "RetakeJay",
    age: 28,
    region: "Europe West",
    timezone: "Europe/Madrid",
    bio: "CS2 anchor looking for calm players who want structure.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "retakejay",
    partyLink: "discord.gg/retakejay",
    onlineStatus: "Online",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 5,
    languages: ["English", "Spanish"],
    playstyles: ["Competitive", "Shotcaller", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["counter-strike-2", "25,000-29,999 CS Rating"],
      ["rainbow-six-siege", "Emerald II"],
    ],
  },
  {
    email: "pulseiris@stackline.gg",
    username: "PulseIris",
    age: 24,
    region: "Europe Nordic",
    timezone: "Europe/Oslo",
    bio: "Controller/sentinel flex. Looking for smart comms over ego.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "pulseiris",
    partyLink: "discord.gg/pulseiris",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 2,
    languages: ["English", "Norwegian"],
    playstyles: ["Competitive", "Chill", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["valorant", "Diamond 1"],
      ["overwatch-2", "Gold 2"],
    ],
  },
  {
    email: "crosshaircam@stackline.gg",
    username: "CrosshairCam",
    age: 23,
    region: "North America",
    timezone: "America/Los_Angeles",
    bio: "Recording clips is optional. Winning the retake isn’t.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "crosshaircam",
    partyLink: "discord.gg/crosshaircam",
    onlineStatus: "Online",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 4,
    languages: ["English"],
    playstyles: ["Competitive", "Mic Required", "Rank Grind"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["counter-strike-2", "10,000-14,999 CS Rating"],
      ["call-of-duty-warzone", "Crimson I"],
    ],
  },
  {
    email: "frostmain@stackline.gg",
    username: "FrostMain",
    age: 21,
    region: "Europe West",
    timezone: "Europe/Amsterdam",
    bio: "Utility-first player. Happy to duo or build a full comp.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "frostmain",
    partyLink: "discord.gg/frostmain",
    onlineStatus: "Away",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 14,
    languages: ["English"],
    playstyles: ["Competitive", "Mic Required", "Beginner Friendly"],
    playTimes: ["Weekday evenings", "Flexible"],
    gameProfiles: [
      ["valorant", "Silver 3"],
      ["rocket-league", "Gold II"],
    ],
  },
  {
    email: "wingmankai@stackline.gg",
    username: "WingmanKai",
    age: 25,
    region: "Asia Pacific",
    timezone: "Asia/Singapore",
    bio: "Apex and Valorant with disciplined comms and no shouting.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "wingmankai",
    partyLink: "discord.gg/wingmankai",
    onlineStatus: "Online",
    currentlyPlaying: "Apex Legends",
    lastActiveMinutesAgo: 6,
    languages: ["English"],
    playstyles: ["Competitive", "Mic Required", "Rank Grind"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["apex-legends", "Master"],
      ["valorant", "Gold 2"],
    ],
  },
  {
    email: "economyrun@stackline.gg",
    username: "EconomyRun",
    age: 27,
    region: "North America",
    timezone: "America/Toronto",
    bio: "CS2 support player. Team-first and always buying for the entry.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "economyrun",
    partyLink: "discord.gg/economyrun",
    onlineStatus: "Away",
    currentlyPlaying: null,
    lastActiveMinutesAgo: 31,
    languages: ["English"],
    playstyles: ["Competitive", "Shotcaller", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["counter-strike-2", "5,000-9,999 CS Rating"],
      ["valorant", "Silver 2"],
    ],
  },
  {
    email: "highgroundana@stackline.gg",
    username: "HighgroundAna",
    age: 24,
    region: "Europe West",
    timezone: "Europe/Rome",
    bio: "Support main looking for mature players and real rotations.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "highgroundana",
    partyLink: "discord.gg/highgroundana",
    onlineStatus: "Online",
    currentlyPlaying: "Overwatch 2",
    lastActiveMinutesAgo: 7,
    languages: ["English", "Italian"],
    playstyles: ["Competitive", "Mic Required", "Chill"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["overwatch-2", "Master 4"],
      ["valorant", "Platinum 2"],
    ],
  },
  {
    email: "duostackrhea@stackline.gg",
    username: "DuoStackRhea",
    age: 22,
    region: "North America",
    timezone: "America/Chicago",
    bio: "Looking for a duo that becomes a trio that becomes a stack.",
    image: "/uploads/demo-nova.svg",
    discordHandle: "duostackrhea",
    partyLink: "discord.gg/duostackrhea",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 2,
    languages: ["English"],
    playstyles: ["Chill", "Mic Required", "Competitive"],
    playTimes: ["Late nights", "Flexible"],
    gameProfiles: [
      ["valorant", "Gold 1"],
      ["fortnite", "Platinum II"],
    ],
  },
  {
    email: "flashretake@stackline.gg",
    username: "FlashRetake",
    age: 30,
    region: "Europe West",
    timezone: "Europe/Lisbon",
    bio: "Older CS2 player, low tilt, high utility value.",
    image: "/uploads/demo-miko.svg",
    discordHandle: "flashretake",
    partyLink: "discord.gg/flashretake",
    onlineStatus: "Online",
    currentlyPlaying: "Counter-Strike 2",
    lastActiveMinutesAgo: 8,
    languages: ["English", "Portuguese"],
    playstyles: ["Competitive", "Shotcaller", "Mic Required"],
    playTimes: ["Weekday evenings", "Weekend evenings"],
    gameProfiles: [
      ["counter-strike-2", "15,000-19,999 CS Rating"],
      ["rainbow-six-siege", "Gold I"],
    ],
  },
  {
    email: "glowreyna@stackline.gg",
    username: "GlowReyna",
    age: 20,
    region: "North America",
    timezone: "America/Los_Angeles",
    bio: "Looking for one or two sharp players to push ranked fast.",
    image: "/uploads/demo-sage.svg",
    discordHandle: "glowreyna",
    partyLink: "discord.gg/glowreyna",
    onlineStatus: "Online",
    currentlyPlaying: "Valorant",
    lastActiveMinutesAgo: 1,
    languages: ["English"],
    playstyles: ["Competitive", "Tryhard", "Rank Grind"],
    playTimes: ["Late nights", "Weekend evenings"],
    gameProfiles: [
      ["valorant", "Immortal 1"],
      ["marvel-rivals", "Diamond II"],
    ],
  },
];

async function ensureSeedColumns() {
  return;
}

async function main() {
  await ensureSeedColumns();
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "email" = REPLACE("email", '@queueup.gg', '@stackline.gg')
    WHERE "email" LIKE '%@queueup.gg'
  `);
  await prisma.$executeRawUnsafe(`DELETE FROM "TeammateRating"`);
  await prisma.$executeRawUnsafe(`DELETE FROM "PlaySession"`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Notification"`);
  await prisma.$executeRawUnsafe(`DELETE FROM "AnalyticsEvent"`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CommunityMessage"`);

  for (const game of GAME_CATALOG) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: { name: game.name, genre: game.genre, active: true },
      create: game,
    });
  }

  for (const userData of demoUsers) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash,
        username: userData.username,
        age: userData.age,
        region: userData.region,
        timezone: userData.timezone,
        bio: userData.bio,
        image: userData.image,
        discordHandle: userData.discordHandle,
        partyLink: userData.partyLink,
        onlineStatus: userData.onlineStatus,
        onboardingCompleted: true,
        lookingForGroup: true,
      },
      create: {
        email: userData.email,
        passwordHash,
        username: userData.username,
        age: userData.age,
        region: userData.region,
        timezone: userData.timezone,
        bio: userData.bio,
        image: userData.image,
        discordHandle: userData.discordHandle,
        partyLink: userData.partyLink,
        onlineStatus: userData.onlineStatus,
        onboardingCompleted: true,
        lookingForGroup: true,
      },
    });

    await prisma.userLanguage.deleteMany({ where: { userId: user.id } });
    await prisma.userPlaystyle.deleteMany({ where: { userId: user.id } });
    await prisma.userPlayTime.deleteMany({ where: { userId: user.id } });
    await prisma.userGameProfile.deleteMany({ where: { userId: user.id } });

    await prisma.$executeRaw`
      UPDATE "User"
      SET "role" = ${
        OWNER_EMAILS.includes(userData.email as (typeof OWNER_EMAILS)[number])
          ? "OWNER"
          : "USER"
      },
          "currentlyPlaying" = ${userData.currentlyPlaying},
          "isLookingNow" = ${LIVE_QUEUE_EMAILS.has(userData.email)},
          "lookingNowStartedAt" = ${
            LIVE_QUEUE_EMAILS.has(userData.email)
              ? new Date(Date.now() - Math.max(1, userData.lastActiveMinutesAgo) * 60_000).toISOString()
              : null
          },
          "lastActiveDate" = ${new Date().toISOString().slice(0, 10)},
          "activeDays" = ${Math.max(2, 8 - Math.min(userData.lastActiveMinutesAgo, 6))},
          "activityStreak" = ${userData.onlineStatus === "Online" ? 3 : 1},
          "positiveRatings" = 0,
          "negativeRatings" = 0,
          "sessionsPlayed" = 0,
          "lastActiveAt" = ${new Date(
            Date.now() - userData.lastActiveMinutesAgo * 60_000
          ).toISOString()}
      WHERE "id" = ${user.id}
    `;

    await prisma.userLanguage.createMany({
      data: userData.languages.map((language) => ({
        userId: user.id,
        language,
      })),
    });

    await prisma.userPlaystyle.createMany({
      data: userData.playstyles.map((tag) => ({
        userId: user.id,
        tag,
      })),
    });

    await prisma.userPlayTime.createMany({
      data: userData.playTimes.map((label) => ({
        userId: user.id,
        label,
      })),
    });

    for (const [slug, rankLabel] of userData.gameProfiles) {
      const game = await prisma.game.findUniqueOrThrow({ where: { slug } });
      await prisma.userGameProfile.create({
        data: {
          userId: user.id,
          gameId: game.id,
          rankLabel,
        },
      });
    }
  }

  const [nova, miko, sage, orbit, lunar, ember, neon, retake, glowReyna] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: "nova@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "miko@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "sage@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "orbit@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "lunar@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "ember@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "neonvandal@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "retakejay@stackline.gg" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "glowreyna@stackline.gg" } }),
  ]);

  const seededMatches = [
    {
      pair: [nova.id, sage.id] as const,
      messages: [
        { senderId: nova.id, content: "Hey, you up for some chill Rocket League tonight?" },
        {
          senderId: sage.id,
          content: "Absolutely. I can hop on after dinner, around 19:30.",
        },
      ],
    },
    {
      pair: [lunar.id, orbit.id] as const,
      messages: [
        {
          senderId: orbit.id,
          content: "You up for a Valorant trio later if we find one more?",
        },
        {
          senderId: lunar.id,
          content: "Yeah, I should be on around 20:00. Happy to duo until then too.",
        },
      ],
    },
    {
      pair: [ember.id, sage.id] as const,
      messages: [
        {
          senderId: ember.id,
          content: "Want to run WoW dungeons or just hang in Minecraft this weekend?",
        },
        {
          senderId: sage.id,
          content: "Minecraft sounds perfect first, then we can see if more people join.",
        },
      ],
    },
    {
      pair: [nova.id, neon.id] as const,
      messages: [
        {
          senderId: neon.id,
          content: "I’m on now if you want to run two or three Valorant matches.",
        },
        {
          senderId: nova.id,
          content: "Perfect. Invite after this page and let’s stack a third.",
        },
      ],
    },
    {
      pair: [orbit.id, retake.id] as const,
      messages: [
        {
          senderId: retake.id,
          content: "Need one for CS2 if you’re still around in 10.",
        },
        {
          senderId: orbit.id,
          content: "I’m in. Happy to anchor if the rest can entry.",
        },
      ],
    },
  ];

  for (const entry of seededMatches) {
    const [userAId, userBId] = [...entry.pair].sort();

    const match = await prisma.match.upsert({
      where: {
        userAId_userBId: { userAId, userBId },
      },
      update: { status: "MATCHED" },
      create: { userAId, userBId, status: "MATCHED" },
    });

    await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: entry.pair[0], toUserId: entry.pair[1] } },
      update: {},
      create: { fromUserId: entry.pair[0], toUserId: entry.pair[1] },
    });

    await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: entry.pair[1], toUserId: entry.pair[0] } },
      update: {},
      create: { fromUserId: entry.pair[1], toUserId: entry.pair[0] },
    });

    const messageCount = await prisma.message.count({ where: { matchId: match.id } });
    if (!messageCount) {
      await prisma.message.createMany({
        data: entry.messages.map((message) => ({
          matchId: match.id,
          senderId: message.senderId,
          content: message.content,
        })),
      });
    }
  }

  const completedSessionId = randomUUID();
  const promptReadySessionId = randomUUID();
  const playAgainRows = await prisma.match.findMany({
    where: {
      OR: [
        { userAId: nova.id, userBId: neon.id },
        { userAId: orbit.id, userBId: retake.id },
        { userAId: nova.id, userBId: sage.id },
      ],
    },
    select: { id: true, userAId: true, userBId: true },
  });
  const novaNeonMatch = playAgainRows.find(
    (row) => [row.userAId, row.userBId].sort().join(":") === [nova.id, neon.id].sort().join(":")
  );
  const orbitRetakeMatch = playAgainRows.find(
    (row) => [row.userAId, row.userBId].sort().join(":") === [orbit.id, retake.id].sort().join(":")
  );

  if (novaNeonMatch) {
    await prisma.$executeRaw`
      INSERT INTO "PlaySession" (
        "id", "matchId", "userAId", "userBId", "initiatorId", "gameSlug",
        "status", "startedAt", "promptAfterAt", "completedAt", "userAConfirmedAt", "userBConfirmedAt"
      ) VALUES (
        ${completedSessionId},
        ${novaNeonMatch.id},
        ${[nova.id, neon.id].sort()[0]},
        ${[nova.id, neon.id].sort()[1]},
        ${nova.id},
        ${"valorant"},
        ${"COMPLETED"},
        ${new Date(Date.now() - 3 * 86_400_000).toISOString()},
        ${new Date(Date.now() - 3 * 86_400_000 + 45 * 60_000).toISOString()},
        ${new Date(Date.now() - 3 * 86_400_000 + 70 * 60_000).toISOString()},
        ${new Date(Date.now() - 3 * 86_400_000 + 70 * 60_000).toISOString()},
        ${new Date(Date.now() - 3 * 86_400_000 + 72 * 60_000).toISOString()}
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO "TeammateRating" ("id", "sessionId", "raterId", "ratedUserId", "value", "note")
      VALUES
        (${randomUUID()}, ${completedSessionId}, ${nova.id}, ${neon.id}, ${1}, ${"Clean comms and instant requeue energy."}),
        (${randomUUID()}, ${completedSessionId}, ${neon.id}, ${nova.id}, ${1}, ${"Reliable IGL and actually on time."})
    `;
  }

  if (orbitRetakeMatch) {
    await prisma.$executeRaw`
      INSERT INTO "PlaySession" (
        "id", "matchId", "userAId", "userBId", "initiatorId", "gameSlug",
        "status", "startedAt", "promptAfterAt"
      ) VALUES (
        ${promptReadySessionId},
        ${orbitRetakeMatch.id},
        ${[orbit.id, retake.id].sort()[0]},
        ${[orbit.id, retake.id].sort()[1]},
        ${retake.id},
        ${"counter-strike-2"},
        ${"PENDING"},
        ${new Date(Date.now() - 2 * 60 * 60_000).toISOString()},
        ${new Date(Date.now() - 75 * 60_000).toISOString()}
      )
    `;
  }

  await prisma.$executeRaw`
    UPDATE "User"
    SET "positiveRatings" = (
      SELECT COUNT(*) FROM "TeammateRating" tr
      WHERE tr."ratedUserId" = "User"."id" AND tr."value" = 1
    ),
    "negativeRatings" = (
      SELECT COUNT(*) FROM "TeammateRating" tr
      WHERE tr."ratedUserId" = "User"."id" AND tr."value" = -1
    ),
    "sessionsPlayed" = (
      SELECT COUNT(*) FROM "PlaySession" ps
      WHERE ps."userAId" = "User"."id" OR ps."userBId" = "User"."id"
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "link", "isRead")
    VALUES
      (${randomUUID()}, ${retake.id}, ${"PLAY_INVITE"}, ${"You got a play invite"}, ${"NovaPulse wants to queue Valorant right now."}, ${"/discover"}, ${false}),
      (${randomUUID()}, ${nova.id}, ${"TEAMMATE_ONLINE"}, ${"A previous teammate is back online"}, ${"NeonVandal is online again."}, ${"/messages"}, ${false}),
      (${randomUUID()}, ${orbit.id}, ${"RANK_QUEUE"}, ${"Your rank is active right now"}, ${"3 players in your rank are queueing now."}, ${"/discover"}, ${false})
  `;

  await prisma.$executeRaw`
    INSERT INTO "AnalyticsEvent" ("id", "type", "userId", "metadata")
    VALUES
      (${randomUUID()}, ${"match_created"}, ${nova.id}, ${JSON.stringify({ source: "seed" })}),
      (${randomUUID()}, ${"invite_sent"}, ${nova.id}, ${JSON.stringify({ source: "seed" })}),
      (${randomUUID()}, ${"invite_accepted"}, ${neon.id}, ${JSON.stringify({ source: "seed" })}),
      (${randomUUID()}, ${"chat_started"}, ${nova.id}, ${JSON.stringify({ source: "seed" })}),
      (${randomUUID()}, ${"session_completed"}, ${nova.id}, ${JSON.stringify({ source: "seed" })})
  `;

  await prisma.$executeRaw`
    INSERT INTO "CommunityMessage" ("id", "userId", "content", "createdAt")
    VALUES
      (${randomUUID()}, ${nova.id}, ${"EUW Ascendant Valorant duo looking for one more with mic."}, ${new Date(Date.now() - 16 * 60_000).toISOString()}),
      (${randomUUID()}, ${retake.id}, ${"Anyone up for CS2 around 20k rating right now?"}, ${new Date(Date.now() - 12 * 60_000).toISOString()}),
      (${randomUUID()}, ${miko.id}, ${"NA Apex squad forming. Chill comms but still playing to win."}, ${new Date(Date.now() - 8 * 60_000).toISOString()}),
      (${randomUUID()}, ${sage.id}, ${"If anyone wants cozy Minecraft or Rocket League later, ping me here."}, ${new Date(Date.now() - 4 * 60_000).toISOString()}),
      (${randomUUID()}, ${glowReyna.id}, ${"Immortal-ish Valorant players around? Need one sharp entry or flex."}, ${new Date(Date.now() - 2 * 60_000).toISOString()})
  `;

  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: orbit.id,
      reportedUserId: ember.id,
      reason: "No-show for scheduled queue",
    },
  });

  if (!existingReport) {
    await prisma.report.create({
      data: {
        reporterId: orbit.id,
        reportedUserId: ember.id,
        reason: "No-show for scheduled queue",
        details: "Said they would join a ranked session and never showed up or replied.",
      },
    });
  }

  const existingInvite = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" as id
    FROM "PlayInvite"
    WHERE "senderId" = ${nova.id}
      AND "receiverId" = ${retake.id}
      AND "status" = 'PENDING'
    LIMIT 1
  `;

  if (!existingInvite.length) {
    await prisma.$executeRaw`
      INSERT INTO "PlayInvite" ("id", "senderId", "receiverId", "gameSlug", "status", "createdAt")
      VALUES (${randomUUID()}, ${nova.id}, ${retake.id}, ${"valorant"}, 'PENDING', CURRENT_TIMESTAMP)
    `;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

