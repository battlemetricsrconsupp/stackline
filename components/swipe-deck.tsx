"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { Heart, MessageCircleMore, SkipForward, Sparkles, X } from "lucide-react";
import { likePlayerAction } from "@/app/_actions/social";
import { BRAND } from "@/lib/brand";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { InviteToPlayButton } from "@/components/invite-to-play-button";
import { Tag } from "@/components/tags";
import { TrustBadges } from "@/components/trust-badges";

type PlayerCard = {
  id: string;
  username: string;
  age: number | null;
  region: string | null;
  bio: string | null;
  image: string | null;
  compatibility: number;
  compatibilityReasons: string[];
  trust: {
    reliabilityScore: number;
    badges: string[];
    positiveRatings: number;
    negativeRatings: number;
  };
  isLookingNow: boolean;
  lookingNowLabel: string | null;
  onlineStatus: "Online" | "Away" | "Offline";
  currentlyPlaying: string | null;
  lastActiveLabel: string;
  languages: string[];
  playstyles: string[];
  games: Array<{ name: string; rankLabel: string; slug: string }>;
};

function statusDotClass(status: PlayerCard["onlineStatus"]) {
  if (status === "Online") return "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]";
  if (status === "Away") return "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.65)]";
  return "bg-slate-400";
}

export function SwipeDeck({ players }: { players: PlayerCard[] }) {
  const [index, setIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<{ username: string } | null>(null);
  const [busyAction, setBusyAction] = useState<"like" | "skip" | null>(null);
  const current = players[index];

  const keyTags = useMemo(() => {
    if (!current) return [];
    return Array.from(new Set([...current.playstyles.slice(0, 2), ...current.languages.slice(0, 1)])).slice(0, 3);
  }, [current]);

  if (!current) {
    return (
      <div className="panel rounded-[2rem] p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
          Closest players shown
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          No exact matches right now
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--text-soft)]">
          Try enabling Looking now, widening your rank range, or changing games. {BRAND.name} will keep
          showing the closest players instead of leaving you on an empty screen.
        </p>
      </div>
    );
  }

  const mainGame = current.games[0];

  function nextCard() {
    setIndex((value) => value + 1);
    setBusyAction(null);
  }

  return (
    <div className="panel app-transition relative mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] p-6 sm:p-7">
      <div className="relative">
        {matchPopup ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#060814]/75 p-4 backdrop-blur-sm">
            <div className="panel max-w-md rounded-[1.5rem] p-6 text-center">
              <button
                type="button"
                onClick={() => setMatchPopup(null)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-soft)]"
                aria-label="Close match popup"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/14 text-[var(--accent)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="hud-label mt-5 text-sm text-[var(--text-soft)]">New match</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {matchPopup.username} matched back
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                Your chat is open. Send a message or queue together now.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)] px-5 py-3 font-semibold text-slate-950"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  Open messages
                </Link>
                <button
                  type="button"
                  onClick={() => setMatchPopup(null)}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">Discover</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              {current.username}
              {current.age ? <span className="text-[var(--text-soft)]">, {current.age}</span> : null}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-soft)]">
              <span>{mainGame?.name ?? "No game selected"}</span>
              {mainGame ? <span className="font-medium text-white">{mainGame.rankLabel}</span> : null}
              <span>{current.region}</span>
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(current.onlineStatus)}`} />
                {current.onlineStatus}
              </span>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
            {current.compatibility}% match
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[13rem_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5">
            {current.image ? (
              <Image src={current.image} alt={current.username} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white">No image</div>
            )}
          </div>

          <div className="section-stack">
            <div className="space-y-3">
              {current.currentlyPlaying ? (
                <p className="text-sm font-medium text-[var(--accent-2)]">
                  Playing {current.currentlyPlaying} now
                </p>
              ) : (
                <p className="text-sm text-[var(--text-soft)]">{current.lastActiveLabel}</p>
              )}
              <p className="line-clamp-1 text-base leading-7 text-[var(--text-soft)]">
                {current.bio || "No bio yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {keyTags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {current.isLookingNow ? <Tag>{current.lookingNowLabel ?? "Looking now"}</Tag> : null}
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[var(--text-soft)]">
                Why you match
              </p>
              <div className="flex flex-wrap gap-2">
                {current.compatibilityReasons.slice(0, 4).map((reason) => (
                  <Tag key={reason}>{reason}</Tag>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <CollapsiblePanel title="Trust signals">
                <TrustBadges
                  badges={current.trust.badges}
                  reliabilityScore={current.trust.reliabilityScore}
                  positiveRatings={current.trust.positiveRatings}
                  negativeRatings={current.trust.negativeRatings}
                />
              </CollapsiblePanel>

              <CollapsiblePanel title="More profile details">
                <div className="space-y-3">
                  <p>{current.bio || "No full bio available."}</p>
                  <div className="flex flex-wrap gap-2">
                    {current.languages.map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                    {current.playstyles.map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel title="Extended stats">
                <div className="space-y-3">
                  <p>{current.lastActiveLabel}</p>
                  {current.currentlyPlaying ? <p>Playing {current.currentlyPlaying} now</p> : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {current.games.map((game) => (
                      <div key={game.slug} className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2">
                        <p className="text-white">{game.name}</p>
                        <p className="text-xs text-[var(--accent)]">{game.rankLabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsiblePanel>
            </div>
          </div>
        </div>

        <div className="sticky bottom-3 mt-6 rounded-[1.6rem] border border-white/10 bg-[#0a1325]/92 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setBusyAction("skip");
                window.setTimeout(nextCard, 110);
              }}
              disabled={busyAction !== null}
              className="app-transition inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white hover:border-white/20 hover:bg-white/8 disabled:cursor-wait disabled:opacity-70"
            >
              <SkipForward className="h-4 w-4" />
              {busyAction === "skip" ? "Skipping..." : "Skip"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBusyAction("like");
                startTransition(async () => {
                  const result = await likePlayerAction(current.id);
                  if (result?.matched) {
                    setMatchPopup({ username: result.username });
                  }
                  nextCard();
                });
              }}
              disabled={busyAction !== null}
              className="app-transition inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)] px-6 py-3 font-semibold text-slate-950 hover:opacity-95 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              <Heart className="h-4 w-4" />
              {busyAction === "like" ? "Liking..." : "Like teammate"}
            </button>
            <InviteToPlayButton
              receiverId={current.id}
              gameSlug={mainGame?.slug}
              label="Invite to play"
              className="flex-1 justify-center rounded-full px-6 py-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
