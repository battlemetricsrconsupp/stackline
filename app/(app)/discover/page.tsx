import { CollapsiblePanel } from "@/components/collapsible-panel";
import { DiscoverRecommendations } from "@/components/discover-recommendations";
import { LiveQueuePanel } from "@/components/live-queue-panel";
import { SwipeDeck } from "@/components/swipe-deck";
import { requireViewer } from "@/lib/auth";
import { getDiscoveryFeed, getPersonalizedSections } from "@/lib/data";
import { getLiveQueue, getOutgoingPendingInviteIds } from "@/lib/live-queue";

export default async function DiscoverPage() {
  const viewer = await requireViewer();
  const [players, liveQueue, outgoingInviteIds, personalizedSections] = await Promise.all([
    getDiscoveryFeed(viewer.id),
    getLiveQueue(viewer.id),
    getOutgoingPendingInviteIds(viewer.id),
    getPersonalizedSections(viewer.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-5">
          <section className="panel rounded-[2rem] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">Discover</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              One strong next teammate
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
              Review the next best fit here. Live queue stays visible alongside it.
            </p>
          </section>

          <div className="xl:hidden">
            <CollapsiblePanel
              title={`Open live queue (${liveQueue.totalLookingNow} looking now)`}
            >
              <LiveQueuePanel
                initialData={{
                  ...liveQueue,
                  outgoingPendingInviteIds: Array.from(outgoingInviteIds),
                }}
                compact
                listMaxHeightClass="max-h-[18rem]"
              />
            </CollapsiblePanel>
          </div>

          <SwipeDeck
            players={players.map((player: (typeof players)[number]) => ({
              id: player.id,
              username: player.username,
              age: player.age,
              region: player.region,
              bio: player.bio,
              image: player.image,
              compatibility: player.compatibility,
              compatibilityReasons: player.compatibilityReasons,
              trust: player.trust,
              isLookingNow: player.isLookingNow,
              lookingNowLabel: player.lookingNowLabel,
              onlineStatus: player.presence.onlineStatus,
              currentlyPlaying: player.presence.currentlyPlaying,
              lastActiveLabel: player.lastActiveLabel,
              languages: player.languages.map(
                (item: (typeof player.languages)[number]) => item.language
              ),
              playstyles: player.playstyles.map(
                (item: (typeof player.playstyles)[number]) => item.tag
              ),
              games: player.gameProfiles.map((item: (typeof player.gameProfiles)[number]) => ({
                name: item.game.name,
                rankLabel: item.rankLabel,
                slug: item.game.slug,
              })),
            }))}
          />

          <DiscoverRecommendations sections={personalizedSections} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <LiveQueuePanel
              initialData={{
                ...liveQueue,
                outgoingPendingInviteIds: Array.from(outgoingInviteIds),
              }}
              compact
              listMaxHeightClass="max-h-[65vh]"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
