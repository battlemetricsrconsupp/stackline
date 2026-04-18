"use client";

import { useState } from "react";
import { Tag } from "@/components/tags";
import { BRAND } from "@/lib/brand";

type RecommendationPlayer = {
  id: string;
  username: string;
  region: string | null;
  reliabilityScore: number;
  badges: string[];
};

const sectionsConfig = [
  {
    key: "bestMatches",
    title: "Best matches",
    description: "High-fit players worth checking next.",
  },
  {
    key: "rankOnline",
    title: "Your rank online",
    description: "Players close to your rank who are active now.",
  },
  {
    key: "recentInGames",
    title: "Recently active",
    description: "Closest active players in your games.",
  },
  {
    key: "playedWellWith",
    title: "Played well with",
    description: "Easy re-connect options that already worked.",
  },
] as const;

type Sections = Record<(typeof sectionsConfig)[number]["key"], RecommendationPlayer[]>;

export function DiscoverRecommendations({ sections }: { sections: Sections }) {
  const [activeTab, setActiveTab] =
    useState<(typeof sectionsConfig)[number]["key"]>("bestMatches");

  const activeSection = sectionsConfig.find((section) => section.key === activeTab)!;
  const players = sections[activeTab];

  return (
    <section className="panel rounded-[2rem] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Recommendations
          </p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">{activeSection.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sectionsConfig.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveTab(section.key)}
              className={`rounded-full px-3 py-2 text-xs transition ${
                activeTab === section.key
                  ? "bg-[var(--accent)] text-slate-950"
                  : "border border-white/10 bg-white/5 text-[var(--text-soft)]"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 max-h-56 overflow-y-auto pr-1">
        <div className="space-y-3">
          {players.length ? (
            players.map((player) => (
              <div
                key={player.id}
                className="rounded-3xl border border-white/8 bg-white/4 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{player.username}</p>
                    <p className="text-sm text-[var(--text-soft)]">{player.region}</p>
                  </div>
                  <span className="text-xs text-[var(--accent-2)]">
                    {player.reliabilityScore}% reliable
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {player.badges.slice(0, 2).map((badge) => (
                    <Tag key={badge}>{badge}</Tag>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-white/8 bg-white/4 p-4 text-sm text-[var(--text-soft)]">
              No exact players here yet. {BRAND.name} is showing the closest active options instead.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
