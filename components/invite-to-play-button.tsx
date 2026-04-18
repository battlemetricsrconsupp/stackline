"use client";

import { startTransition, useState } from "react";
import { Radio } from "lucide-react";
import { sendPlayInviteAction } from "@/app/_actions/live-queue";

export function InviteToPlayButton({
  receiverId,
  gameSlug,
  label = "Invite to play",
  pending = false,
  className = "",
}: {
  receiverId: string;
  gameSlug?: string | null;
  label?: string;
  pending?: boolean;
  className?: string;
}) {
  const [sent, setSent] = useState(pending);
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy || sent}
      onClick={() => {
        setBusy(true);
        startTransition(async () => {
          const result = await sendPlayInviteAction({ receiverId, gameSlug });
          if (result?.ok) {
            setSent(true);
          }
          setBusy(false);
        });
      }}
      className={`app-transition inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 ${
        sent
          ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
          : "border border-[var(--accent)]/25 bg-[var(--accent)] text-slate-950 hover:opacity-95 active:scale-[0.99]"
      } ${className}`}
    >
      <Radio className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
      {sent ? "Invite sent" : busy ? "Sending..." : label}
    </button>
  );
}
