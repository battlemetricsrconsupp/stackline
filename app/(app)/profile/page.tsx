import { formatLastActive, getPresenceForUser } from "@/lib/activity";
import { ProfileForm } from "@/components/profile-form";
import { TrustBadges } from "@/components/trust-badges";
import { getCatalogData } from "@/lib/data";
import { getUserTrustMap } from "@/lib/engagement";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/auth";

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const [games, profile, presence, trustMap] = await Promise.all([
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
    getPresenceForUser(viewer.id),
    getUserTrustMap([viewer.id]),
  ]);
  const trust = trustMap.get(viewer.id) ?? {
    reliabilityScore: 65,
    badges: [],
    positiveRatings: 0,
    negativeRatings: 0,
    activeDays: 0,
    activityStreak: 0,
    sessionsPlayed: 0,
  };

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
          My profile
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Keep your teammate profile sharp and current
        </h1>
        <p className="mt-3 text-[var(--text-soft)]">
          Edit your games, ranks, tags, and availability any time. Better data means better matches.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <div className="hud-frame border border-white/10 bg-white/5 px-4 py-2 text-white">
            <span
              className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
                presence.onlineStatus === "Online"
                  ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                  : presence.onlineStatus === "Away"
                    ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.65)]"
                    : "bg-slate-400"
              }`}
            />
            {presence.onlineStatus}
          </div>
          <div className="hud-frame border border-white/10 bg-white/5 px-4 py-2 text-[var(--text-soft)]">
            {formatLastActive(presence.lastActiveAt)}
          </div>
          {presence.currentlyPlaying ? (
            <div className="hud-frame border border-[var(--accent-2)]/20 bg-[var(--accent-2)]/10 px-4 py-2 text-[var(--accent-2)]">
              Playing {presence.currentlyPlaying} now
            </div>
          ) : null}
          <div className="hud-frame border border-white/10 bg-white/5 px-4 py-2 text-[var(--text-soft)]">
            {trust.activityStreak}-day streak
          </div>
          <div className="hud-frame border border-white/10 bg-white/5 px-4 py-2 text-[var(--text-soft)]">
            {trust.sessionsPlayed} sessions played
          </div>
        </div>
        <div className="mt-5">
          <TrustBadges
            badges={trust.badges}
            reliabilityScore={trust.reliabilityScore}
            positiveRatings={trust.positiveRatings}
            negativeRatings={trust.negativeRatings}
          />
        </div>
      </section>

      <ProfileForm
        submitLabel="Save profile"
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
          currentlyPlaying: presence.currentlyPlaying,
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
