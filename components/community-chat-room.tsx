"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Radio, Send } from "lucide-react";

type CommunityChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    image: string | null;
    region: string | null;
    onlineStatus: "Online" | "Away" | "Offline";
    currentlyPlaying: string | null;
    lastActiveLabel: string;
  };
};

function statusDotClass(status: CommunityChatMessage["user"]["onlineStatus"]) {
  if (status === "Online") return "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]";
  if (status === "Away") return "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.65)]";
  return "bg-slate-400";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CommunityChatRoom({
  initialMessages,
  initialOnlineCount,
  viewerId,
}: {
  initialMessages: CommunityChatMessage[];
  initialOnlineCount: number;
  viewerId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [onlineCount, setOnlineCount] = useState(initialOnlineCount);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastMessageId = useMemo(() => messages.at(-1)?.id ?? null, [messages]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const nearBottom =
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 120;

    if (nearBottom) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [lastMessageId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const response = await fetch("/api/community-chat", { cache: "no-store" });
      if (!response.ok || cancelled) {
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as {
        onlineCount: number;
        messages: CommunityChatMessage[];
      };

      if (!cancelled) {
        setMessages(payload.messages);
        setOnlineCount(payload.onlineCount);
        setLoading(false);
      }
    };

    const interval = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || sending) {
      return;
    }

    setSending(true);
    const response = await fetch("/api/community-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        ok: boolean;
        message: CommunityChatMessage;
      };
      setMessages((current) => [...current, payload.message]);
      setDraft("");
    }

    setSending(false);
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">
            Community chat
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Open squad lobby</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            One shared room for quick queue calls, live pings, and finding people who are on now.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-soft)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            {onlineCount} online
          </span>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-2)]">
            {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
            Live refresh
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1"
      >
        {messages.length ? (
          messages.map((message) => {
            const ownMessage = message.user.id === viewerId;
            return (
              <div
                key={message.id}
                className={`rounded-[1.5rem] px-4 py-3 ${
                  ownMessage
                    ? "ml-auto max-w-2xl border border-[var(--accent)]/20 bg-[var(--accent)] text-slate-950"
                    : "max-w-2xl border border-white/10 bg-white/5 text-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(message.user.onlineStatus)}`} />
                  <span className={ownMessage ? "font-semibold text-slate-900/80" : "font-semibold text-white"}>
                    {message.user.username}
                  </span>
                  <span className={ownMessage ? "text-slate-900/65" : "text-[var(--text-soft)]"}>
                    {message.user.region}
                  </span>
                  <span className={ownMessage ? "text-slate-900/65" : "text-[var(--text-soft)]"}>
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                <p className={`mt-2 text-sm leading-6 ${ownMessage ? "text-slate-950" : "text-white"}`}>
                  {message.content}
                </p>
                {message.user.currentlyPlaying ? (
                  <p className={`mt-2 text-xs ${ownMessage ? "text-slate-900/70" : "text-[var(--accent-2)]"}`}>
                    Playing {message.user.currentlyPlaying} now
                  </p>
                ) : (
                  <p className={`mt-2 text-xs ${ownMessage ? "text-slate-900/70" : "text-[var(--text-soft)]"}`}>
                    {message.user.lastActiveLabel}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-5 text-sm text-[var(--text-soft)]">
            No one has said anything yet. Be the first to call for a duo, trio, or stack.
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
        className="mt-5 flex gap-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={400}
          placeholder="Say what you want to queue, your rank, or who you need..."
          className="app-transition flex-1 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-2)]/45 focus:bg-white/6"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="app-transition rounded-2xl bg-white px-5 py-3 font-medium text-slate-950 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </span>
        </button>
      </form>
    </section>
  );
}
