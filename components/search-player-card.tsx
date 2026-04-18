"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, X } from "lucide-react";
import { reportPlayerAction } from "@/app/_actions/social";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { InviteToPlayButton } from "@/components/invite-to-play-button";
import { Tag } from "@/components/tags";
import { TrustBadges } from "@/components/trust-badges";

type SearchPlayer = {
  id: string;
  username: string;
  age: number | null;
  region: string | null;
  bio: string | null;
  lastActiveLabel: string;
  matchId: string | null;
  presence: {
    onlineStatus: "Online" | "Away" | "Offline";
    currentlyPlaying: string | null;
  };
  trust: {
    reliabilityScore: number;
    badges: string[];
    positiveRatings: number;
    negativeRatings: number;
  };
  languages: Array<{ id: string; language: string }>;
  playstyles: Array<{ id: string; tag: string }>;
  gameProfiles: Array<{
    id: string;
    rankLabel: string;
    game: { name: string; slug: string };
  }>;
};

export function SearchPlayerCard({ player }: { player: SearchPlayer }) {
  const [reportOpen, setReportOpen] = useState(false);
  const action = reportPlayerAction.bind(null, player.id);

  return (
    <>
      <div className="panel rounded-[2rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-white">
              {player.username}
              {player.age ? <span className="text-[var(--text-soft)]">, {player.age}</span> : null}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-soft)]">
              <span className="text-white">{player.gameProfiles[0]?.game.name ?? "No game"}</span>
              <span>{player.gameProfiles[0]?.rankLabel ?? "Unranked"}</span>
              <span>{player.region}</span>
              <span>{player.presence.onlineStatus}</span>
            </div>
            <p className="mt-3 line-clamp-2 max-w-2xl text-[var(--text-soft)]">
              {player.bio || "No bio yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {player.matchId ? (
              <Link
                href={`/messages?match=${player.matchId}`}
                className="glow inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] px-4 py-2.5 text-sm font-semibold text-slate-950"
              >
                Message
              </Link>
            ) : null}
            <InviteToPlayButton
              receiverId={player.id}
              gameSlug={player.gameProfiles[0]?.game.slug}
              label={player.matchId ? "Invite again" : "Invite"}
              className="px-4 py-2.5"
            />
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-soft)]"
            >
              <Flag className="h-4 w-4" />
              Report
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {player.playstyles.slice(0, 2).map((item) => (
            <Tag key={item.id}>{item.tag}</Tag>
          ))}
          {player.languages.slice(0, 1).map((item) => (
            <Tag key={item.id}>{item.language}</Tag>
          ))}
          <Tag>{player.lastActiveLabel}</Tag>
        </div>

        <div className="mt-4">
          <TrustBadges
            badges={player.trust.badges}
            reliabilityScore={player.trust.reliabilityScore}
            positiveRatings={player.trust.positiveRatings}
            negativeRatings={player.trust.negativeRatings}
          />
        </div>

        <div className="mt-4">
          <CollapsiblePanel title="View more">
            <div className="space-y-3">
              <p>{player.bio || "No full bio available."}</p>
              <div className="flex flex-wrap gap-2">
                {player.gameProfiles.map((item) => (
                  <Tag key={item.id}>
                    {item.game.name} · {item.rankLabel}
                  </Tag>
                ))}
                {player.playstyles.map((item) => (
                  <Tag key={item.id}>{item.tag}</Tag>
                ))}
                {player.languages.map((item) => (
                  <Tag key={item.id}>{item.language}</Tag>
                ))}
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      </div>

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060814]/78 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Report</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Report {player.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--text-soft)]"
                aria-label="Close report dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="mt-5 space-y-4">
              <input
                name="reason"
                placeholder="Reason for report"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
              <textarea
                name="details"
                placeholder="Optional details"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-5 py-3 text-[var(--danger)]">
                  Submit report
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
