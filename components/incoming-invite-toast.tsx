"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, X } from "lucide-react";

type Invite = {
  id: string;
  senderUsername: string;
  senderRegion: string | null;
  senderOnlineStatus: string | null;
  gameSlug: string | null;
  createdAt: string;
};

function gameLabelFromSlug(slug: string | null) {
  if (!slug) return "a game";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function IncomingInviteToast({
  initialInvites,
}: {
  initialInvites: Invite[];
}) {
  const [invites, setInvites] = useState(initialInvites);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/play-invites", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { invites: Invite[] };
      setInvites(payload.invites);
    };

    const interval = window.setInterval(load, 12000);
    return () => window.clearInterval(interval);
  }, []);

  const visibleInvite = useMemo(
    () => invites.find((invite) => !dismissedIds.includes(invite.id)) ?? null,
    [dismissedIds, invites]
  );

  if (!visibleInvite) {
    return null;
  }

  async function respond(accept: boolean) {
    if (!visibleInvite) {
      return;
    }

    const invite = visibleInvite;
    const response = await fetch("/api/play-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "respond",
        inviteId: invite.id,
        accept,
      }),
    });

    setDismissedIds((current) => [...current, invite.id]);

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { accepted?: boolean; matchId?: string };
    if (accept && payload.matchId) {
      router.push(`/messages?match=${payload.matchId}`);
      router.refresh();
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 max-w-sm">
      <div className="pointer-events-auto panel hud-frame border border-[#ff7b58]/20 p-5 shadow-[0_18px_60px_rgba(4,10,24,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7b58,#ffb95c)] text-slate-950">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {visibleInvite.senderUsername} invited you to play
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                {gameLabelFromSlug(visibleInvite.gameSlug)} · {visibleInvite.senderRegion}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-2)]">
                Ready to queue now?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedIds((current) => [...current, visibleInvite.id])}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--text-soft)]"
            aria-label="Dismiss invite"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void respond(true)}
            className="glow flex-1 rounded-full bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] px-4 py-2.5 text-sm font-semibold text-slate-950"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => void respond(false)}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
