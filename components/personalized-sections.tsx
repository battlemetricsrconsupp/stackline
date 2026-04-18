import { TrustBadges } from "@/components/trust-badges";
import { BRAND } from "@/lib/brand";

function SectionCard({
  title,
  description,
  players,
}: {
  title: string;
  description: string;
  players: Array<{
    id: string;
    username: string;
    region: string | null;
    reliabilityScore: number;
    badges: string[];
    positiveRatings: number;
    negativeRatings: number;
  }>;
}) {
  return (
    <section className="panel rounded-[2rem] p-5">
      <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
      <div className="mt-4 space-y-3">
        {players.length ? (
          players.map((player) => (
            <div key={player.id} className="rounded-3xl border border-white/8 bg-white/4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{player.username}</p>
                  <p className="text-sm text-[var(--text-soft)]">{player.region}</p>
                </div>
                <span className="text-xs text-[var(--accent-2)]">
                  {player.reliabilityScore}% reliable
                </span>
              </div>
              <div className="mt-3">
                <TrustBadges
                  badges={player.badges}
                  reliabilityScore={player.reliabilityScore}
                  positiveRatings={player.positiveRatings}
                  negativeRatings={player.negativeRatings}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-white/8 bg-white/4 p-4 text-sm text-[var(--text-soft)]">
            No exact matches here yet. {BRAND.name} is showing closest players while activity catches up.
          </div>
        )}
      </div>
    </section>
  );
}

export function PersonalizedSections({
  sections,
}: {
  sections: {
    bestMatches: Array<{
      id: string;
      username: string;
      region: string | null;
      reliabilityScore: number;
      badges: string[];
      positiveRatings: number;
      negativeRatings: number;
    }>;
    rankOnline: Array<{
      id: string;
      username: string;
      region: string | null;
      reliabilityScore: number;
      badges: string[];
      positiveRatings: number;
      negativeRatings: number;
    }>;
    recentInGames: Array<{
      id: string;
      username: string;
      region: string | null;
      reliabilityScore: number;
      badges: string[];
      positiveRatings: number;
      negativeRatings: number;
    }>;
    playedWellWith: Array<{
      id: string;
      username: string;
      region: string | null;
      reliabilityScore: number;
      badges: string[];
      positiveRatings: number;
      negativeRatings: number;
    }>;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        title="Best matches right now"
        description="High-fit players with activity and trust signals working in your favor."
        players={sections.bestMatches}
      />
      <SectionCard
        title="Players in your rank online"
        description="Useful ranked options first, not random online noise."
        players={sections.rankOnline}
      />
      <SectionCard
        title="Recently active in your games"
        description="Closest players when exact live queue matches are thin."
        players={sections.recentInGames}
      />
      <SectionCard
        title="People you played well with"
        description="Easy rematches for duos and trios that already worked."
        players={sections.playedWellWith}
      />
    </div>
  );
}
