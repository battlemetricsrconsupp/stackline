import Link from "next/link";
import { InviteToPlayButton } from "@/components/invite-to-play-button";
import { TrustBadges } from "@/components/trust-badges";

export function RecentlyPlayed({
  players,
}: {
  players: Array<{
    sessionId: string;
    matchId: string | null;
    otherUserId: string;
    otherUsername: string;
    otherRegion: string | null;
    gameSlug: string | null;
    reliabilityScore: number;
    badges: string[];
    positiveRatings: number;
    negativeRatings: number;
    presence: {
      onlineStatus: "Online" | "Away" | "Offline";
    };
  }>;
}) {
  if (!players.length) {
    return null;
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
        Recently played with
      </p>
      <div className="mt-4 space-y-3">
        {players.map((player) => (
          <div key={player.sessionId} className="rounded-3xl border border-white/8 bg-white/4 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{player.otherUsername}</p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{player.otherRegion}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent-2)]">
                {player.presence.onlineStatus}
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
            <div className="mt-4 flex flex-wrap gap-3">
              {player.matchId ? (
                <Link
                  href={`/messages?match=${player.matchId}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                >
                  Open chat
                </Link>
              ) : null}
              <InviteToPlayButton
                receiverId={player.otherUserId}
                gameSlug={player.gameSlug}
                label="Play again"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
