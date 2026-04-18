import { LiveQueuePanel } from "@/components/live-queue-panel";
import { PersonalizedSections } from "@/components/personalized-sections";
import { RecentlyPlayed } from "@/components/recently-played";
import { requireViewer } from "@/lib/auth";
import { getLiveActivitySummary, getPersonalizedSections } from "@/lib/data";
import { getRecentlyPlayedWith } from "@/lib/engagement";
import { getLiveQueue, getOutgoingPendingInviteIds } from "@/lib/live-queue";

export default async function LiveQueuePage() {
  const viewer = await requireViewer();
  const [liveActivity, liveQueue, outgoingInviteIds, personalizedSections, recentlyPlayed] =
    await Promise.all([
      getLiveActivitySummary(),
      getLiveQueue(viewer.id),
      getOutgoingPendingInviteIds(viewer.id),
      getPersonalizedSections(viewer.id),
      getRecentlyPlayedWith(viewer.id),
    ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Live Queue</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Players ready right now
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-soft)]">
          Quick invites, live activity, and the best active teammates in one place.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <LiveQueuePanel
          initialData={{
            ...liveQueue,
            outgoingPendingInviteIds: Array.from(outgoingInviteIds),
          }}
        />

        <div className="space-y-6">
          <section className="panel rounded-[2rem] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Queue pulse</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-soft)]">
              <p>{liveActivity.onlineCount} players are online right now.</p>
              <p>{liveQueue.inYourRankCount} players in your rank are looking right now.</p>
              {liveActivity.perGame.slice(0, 4).map((entry) => (
                <p key={entry.gameName}>
                  {entry.total} active in {entry.gameName}
                </p>
              ))}
            </div>
          </section>

          <RecentlyPlayed players={recentlyPlayed.slice(0, 4)} />
        </div>
      </div>

      <PersonalizedSections sections={personalizedSections} />
    </div>
  );
}
