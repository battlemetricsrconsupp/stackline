import { ShieldCheck } from "lucide-react";

export function TrustBadges({
  badges,
  reliabilityScore,
  positiveRatings,
  negativeRatings,
}: {
  badges: string[];
  reliabilityScore: number;
  positiveRatings: number;
  negativeRatings: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        {reliabilityScore}% reliable
      </span>
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[var(--text-soft)]"
        >
          {badge}
        </span>
      ))}
      <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[var(--text-soft)]">
        +{positiveRatings}
      </span>
      {negativeRatings ? (
        <span className="rounded-full border border-[var(--danger)]/15 bg-[var(--danger)]/10 px-3 py-1.5 text-xs text-[var(--danger)]">
          -{negativeRatings}
        </span>
      ) : null}
    </div>
  );
}
