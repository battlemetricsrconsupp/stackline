"use client";

import { useRef, useState, useTransition } from "react";
import { Gamepad2, Link2, Send, Swords } from "lucide-react";
import { sendMessageAction } from "@/app/_actions/social";

export function MessageComposer({
  matchId,
  discordHandle,
  partyLink,
}: {
  matchId: string;
  discordHandle?: string | null;
  partyLink?: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const action = sendMessageAction.bind(null, matchId);

  const quickMessages = [
    "I'm ready to play now if you are.",
    partyLink
      ? `Join party: ${partyLink}`
      : discordHandle
        ? `Discord: ${discordHandle}`
        : "Want to swap Discord and queue right now?",
    "Let's duo or trio right now if you're free.",
  ];

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDraft(quickMessages[0])}
          className="app-transition rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:border-white/20 hover:bg-white/8"
        >
          <span className="inline-flex items-center gap-2">
            <Gamepad2 className="h-3.5 w-3.5" />
            I&apos;m ready to play now
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDraft(quickMessages[1])}
          className="app-transition rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:border-white/20 hover:bg-white/8"
        >
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5" />
            Send Discord invite
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDraft(quickMessages[2])}
          className="app-transition rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:border-white/20 hover:bg-white/8"
        >
          <span className="inline-flex items-center gap-2">
            <Swords className="h-3.5 w-3.5" />
            Let&apos;s duo/trio
          </span>
        </button>
      </div>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await action(formData);
            setDraft("");
            formRef.current?.reset();
          });
        }}
        className="flex gap-3"
      >
        <input
          name="content"
          placeholder="Send a message..."
          maxLength={500}
          required
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="app-transition flex-1 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-2)]/45 focus:bg-white/6"
        />
        <button
          disabled={pending}
          className="app-transition rounded-2xl bg-white px-5 py-3 font-medium text-slate-950 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2">
            <Send className="h-4 w-4" />
            {pending ? "Sending..." : "Send"}
          </span>
        </button>
      </form>
    </div>
  );
}
