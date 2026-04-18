import { getLiveActivitySummary } from "@/lib/activity";
import { ProfileForm } from "@/components/profile-form";
import { requireViewer } from "@/lib/auth";
import { getCatalogData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  const [games, profile, liveActivity] = await Promise.all([
    getCatalogData(),
    prisma.user.findUniqueOrThrow({
      where: { id: viewer.id },
      include: {
        languages: true,
        playstyles: true,
        playTimes: true,
        gameProfiles: { include: { game: true } },
      },
    }),
    getLiveActivitySummary(),
  ]);
  const primaryGame = profile.gameProfiles[0];
  const sameRankHint =
    primaryGame && profile.region
      ? await prisma.userGameProfile.count({
          where: {
            rankLabel: primaryGame.rankLabel,
            gameId: primaryGame.gameId,
            user: {
              id: { not: viewer.id },
              accountStatus: "ACTIVE",
              lookingForGroup: true,
              onboardingCompleted: true,
              region: profile.region,
              onlineStatus: "Online",
            },
          },
        })
      : 0;

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
          Onboarding
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Let&apos;s turn @{viewer.username} into a teammate people can discover
        </h1>
        <p className="mt-3 max-w-3xl text-[var(--text-soft)]">
          We already saved your starter picks. Now add the details that make
          matching feel smart: ranks, bio, schedule, and social links.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="hud-frame border border-white/10 bg-white/5 px-4 py-4 text-sm text-white">
            {sameRankHint
              ? `${sameRankHint} players online in your rank right now`
              : `${liveActivity.onlineCount} players online and ready to queue`}
          </div>
          <div className="hud-frame border border-[var(--accent-2)]/20 bg-[var(--accent-2)]/10 px-4 py-4 text-sm text-[var(--accent-2)]">
            Like a teammate to connect instantly after setup
          </div>
        </div>
      </section>

      <ProfileForm
        submitLabel="Finish setup"
        games={games.map((game) => ({ slug: game.slug, name: game.name }))}
        profile={{
          username: profile.username,
          age: profile.age,
          region: profile.region,
          timezone: profile.timezone,
          bio: profile.bio,
          image: profile.image,
          discordHandle: profile.discordHandle,
          partyLink: profile.partyLink,
          onlineStatus: profile.onlineStatus,
          currentlyPlaying: null,
          lookingForGroup: profile.lookingForGroup,
          languages: profile.languages.map((item) => item.language),
          playstyles: profile.playstyles.map((item) => item.tag),
          playTimes: profile.playTimes.map((item) => item.label),
          gameProfiles: profile.gameProfiles.map((item) => ({
            slug: item.game.slug,
            rankLabel: item.rankLabel,
          })),
        }}
      />
    </div>
  );
}
