import Link from "next/link";
import { ArrowRight, MessageCircleMore, Search, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { Tag } from "@/components/tags";
import { getLiveActivitySummary } from "@/lib/data";
import { getLiveQueue } from "@/lib/live-queue";

const highlights = [
  "Rank-aware player cards",
  "Private matches and community chat",
  "Live queue when you need people now",
  "Reports, blocks, and moderation tools",
];

export default async function LandingPage() {
  const [liveActivity, liveQueue] = await Promise.all([
    getLiveActivitySummary(),
    getLiveQueue(),
  ]);

  const liveSummary = [
    `${liveActivity.onlineCount} players online`,
    `${liveQueue.totalLookingNow} looking now`,
    ...liveQueue.perGame.slice(0, 2).map((entry) => `${entry.total} in ${entry.gameName}`),
  ].join(" • ");

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="panel rounded-[1.5rem] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Logo />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-8 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="hud-label text-sm text-[var(--text-soft)]">
            Find players by rank, game, and availability
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.9rem] font-semibold leading-[1.02] text-white md:text-[4.1rem]">
            Find teammates in your rank
            <span className="hero-shimmer"> in under 60 seconds</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
            Set your games, ranks, language, and playstyle. Then browse one strong match at a
            time, search directly, or jump into the live queue when you want to play now.
          </p>
          <div className="mt-6 inline-flex max-w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-soft)]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
            {liveSummary}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)] px-6 py-4 font-semibold text-slate-950"
            >
              Find teammates now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-white"
            >
              Join live queue ({liveQueue.totalLookingNow} live)
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {highlights.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </div>

        <div className="panel rounded-[1.75rem] p-6">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
              <p className="hud-label text-sm text-[var(--text-soft)]">How it works</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Create a profile with your games, rank, and schedule.",
                  "Review the next best player or search directly.",
                  "Message, invite, or use live queue when you are ready to play.",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-semibold text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-white/92">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
              <p className="hud-label text-sm text-[var(--text-soft)]">Live activity</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                {liveQueue.totalLookingNow} players are in live queue right now.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {liveQueue.perGame.map((entry) => (
                  <Tag key={entry.gameName}>
                    {entry.total} {entry.gameName}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Scout", icon: Search, body: "Browse one strong profile at a time." },
                { label: "Comms", icon: MessageCircleMore, body: "Move from match to message fast." },
                { label: "Safety", icon: Shield, body: "Use reports, blocks, and admin review." },
              ].map(({ label, icon: Icon, body }) => (
                <div key={label} className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                  <p className="mt-4 text-lg font-medium text-white">{label}</p>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
