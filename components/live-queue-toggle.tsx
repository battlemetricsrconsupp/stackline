"use client";

import { startTransition, useState } from "react";
import { Flame } from "lucide-react";
import { toggleLookingNowAction } from "@/app/_actions/live-queue";

export function LiveQueueToggle({
  initialLookingNow,
  initialTotalLookingNow,
}: {
  initialLookingNow: boolean;
  initialTotalLookingNow: number;
}) {
  const [busy, setBusy] = useState(false);
  const [lookingNow, setLookingNow] = useState(initialLookingNow);
  const [nextState, setNextState] = useState<boolean | null>(null);

  const buttonClass = lookingNow
    ? "border-[var(--accent)]/30 bg-[var(--accent)] text-slate-950"
    : "border-white/10 bg-white/5 text-white";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        const nextValue = !lookingNow;
        setBusy(true);
        setNextState(nextValue);
        startTransition(async () => {
          setLookingNow(nextValue);
          await toggleLookingNowAction(nextValue);
          setBusy(false);
          setNextState(null);
        });
      }}
      className={`app-transition hud-frame inline-flex items-center gap-3 border px-4 py-2 text-sm font-medium hover:opacity-95 disabled:cursor-wait disabled:opacity-70 ${buttonClass}`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${lookingNow ? "bg-black/10" : "bg-white/10"} ${busy ? "animate-pulse" : ""}`}
      >
        <Flame className="h-4 w-4" />
      </span>
      <span className="text-left">
        <span className="block leading-none">
          {busy
            ? nextState
              ? "Going live..."
              : "Going quiet..."
            : lookingNow
              ? "Live queue on"
              : "Looking now"}
        </span>
        <span
        className={`mt-1 block text-[11px] leading-none ${lookingNow ? "text-slate-900/80" : "text-[var(--text-soft)]"}`}
        >
          {nextState ?? lookingNow ? "Visible in live queue" : `${initialTotalLookingNow} players live`}
        </span>
      </span>
    </button>
  );
}
