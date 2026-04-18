"use client";

import { useEffect, useState } from "react";
import { Radio, TimerReset } from "lucide-react";
import { InviteToPlayButton } from "@/components/invite-to-play-button";
import { TrustBadges } from "@/components/trust-badges";

type LiveQueuePlayer = {
  id: string;
  username: string;
  region: string | null;
  primaryGameName: string;
  primaryGameRank: string;
  primaryGameSlug: string | null;
  lookingNowLabel: string;
  trust: {
    reliabilityScore: number;
    badges: string[];
    positiveRatings: number;
    negativeRatings: number;
  };
  presence: {
    onlineStatus: "Online" | "Away" | "Offline";
  };
};

type LiveQueuePayload = {
  totalLookingNow: number;
  inYourRankCount: number;
  inYourGameCount: number;
  perGame: Array<{ gameName: string; total: number }>;
  players: LiveQueuePlayer[];
  outgoingPendingInviteIds: string[];
};

function statusDotClass(status: LiveQueuePlayer["presence"]["onlineStatus"]) {
  if (status === "Online") return "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]";
  if (status === "Away") return "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.65)]";
  return "bg-slate-400";
}

export function LiveQueuePanel({
  initialData,
  compact = false,
  listMaxHeightClass = "max-h-[32rem]",
}: {
  initialData: LiveQueuePayload;
  compact?: boolean;
  listMaxHeightClass?: string;
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/live-queue", { cache: "no-store" });
      if (!response.ok) return;
      const nextData = (await response.json()) as LiveQueuePayload;
      setData(nextData);
    };

    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className={`panel rounded-[2rem] ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">Live queue</p>
          <h2 className={`font-semibold text-white ${compact ? "mt-2 text-lg" : "mt-3 text-2xl"}`}>
            {data.totalLookingNow} players looking now
          </h2>
          <p className={`mt-2 leading-6 text-[var(--text-soft)] ${compact ? "text-xs" : "text-sm"}`}>
            {data.inYourRankCount} players in your rank and {data.inYourGameCount} in your games
            are ready right now.
          </p>
        </div>
        <div className={`rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-soft)] ${compact ? "" : ""}`}>
          Live
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 ${compact ? "mt-4" : "mt-5"}`}>
        {data.perGame.map((entry) => (
          <span
            key={entry.gameName}
            className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-[11px] text-[var(--text-soft)]"
          >
            {entry.total} {entry.gameName}
          </span>
        ))}
      </div>

      <div className={`mt-4 overflow-y-auto pr-1 ${listMaxHeightClass}`}>
        <div className={compact ? "space-y-2.5" : "space-y-3"}>
        {data.players.length ? (
          data.players.map((player) => (
            <div
              key={player.id}
              className={`app-transition rounded-3xl border border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/5 ${
                compact ? "p-3" : "group p-4"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`truncate font-semibold text-white ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
                      {player.username}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                      Live
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-soft)] sm:text-xs">
                    <span>{player.primaryGameName}</span>
                    <span className="text-white">{player.primaryGameRank}</span>
                    <span>{player.region}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusDotClass(player.presence.onlineStatus)}`}
                      />
                      {player.presence.onlineStatus}
                    </span>
                  </div>
                </div>
                <InviteToPlayButton
                  receiverId={player.id}
                  gameSlug={player.primaryGameSlug}
                  pending={data.outgoingPendingInviteIds.includes(player.id)}
                  label="Invite"
                  className={`shrink-0 ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
                />
              </div>

              {!compact ? (
                <div className="mt-0 max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-4 group-hover:max-h-48 group-hover:opacity-100 sm:group-focus-within:mt-4 sm:group-focus-within:max-h-48 sm:group-focus-within:opacity-100">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
                    <span className="flex items-center gap-2 text-[var(--text-soft)]">
                      <TimerReset className="h-3.5 w-3.5" />
                      {player.lookingNowLabel}
                    </span>
                  </div>
                  <div className="mt-3">
                    <TrustBadges
                      badges={player.trust.badges}
                      reliabilityScore={player.trust.reliabilityScore}
                      positiveRatings={player.trust.positiveRatings}
                      negativeRatings={player.trust.negativeRatings}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-white/8 bg-white/4 p-5 text-sm text-[var(--text-soft)]">
            No one is in live queue right this second. Stay visible and we&apos;ll keep checking.
          </div>
        )}
        </div>
      </div>

      <div className={`${compact ? "mt-4" : "mt-5"} flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--accent-2)]/80`}>
        <Radio className="h-3.5 w-3.5" />
        Refreshes every 15s
      </div>
    </section>
  );
}
