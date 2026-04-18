import Link from "next/link";
import { MessageComposer } from "@/components/message-composer";
import { SessionFollowupCard } from "@/components/session-followup-card";
import { Tag } from "@/components/tags";
import { getMatchesForUser } from "@/lib/data";
import { requireViewer } from "@/lib/auth";
import { getPendingSessionPrompts } from "@/lib/engagement";

export default async function MessagesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireViewer();
  const [matches, searchParams, sessionPrompts] = await Promise.all([
    getMatchesForUser(viewer.id),
    props.searchParams,
    getPendingSessionPrompts(viewer.id),
  ]);
  const requestedMatchId =
    typeof searchParams.match === "string" ? searchParams.match : "";
  const activeMatch =
    matches.find((match) => match.id === requestedMatchId) ?? matches[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.36fr_1fr]">
      <aside className="panel rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
          Your matches
        </p>
        <div className="mt-5 space-y-3">
          {matches.length ? (
            matches.map((match) => (
              <Link
                key={match.id}
                href={`/messages?match=${match.id}`}
                className={`block rounded-3xl border p-4 transition ${
                  activeMatch?.id === match.id
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                    : "border-white/8 bg-white/4 hover:border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {match.otherUser.username}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
                      <span>{match.otherUser.region}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            match.otherUser.presence.onlineStatus === "Online"
                              ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                              : match.otherUser.presence.onlineStatus === "Away"
                                ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.65)]"
                                : "bg-slate-400"
                          }`}
                        />
                        {match.otherUser.presence.onlineStatus}
                      </span>
                    </div>
                  </div>
                  {match.lastMessage ? (
                    <span className="text-xs text-[var(--text-soft)]">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                      }).format(match.lastMessage.createdAt)}
                    </span>
                  ) : null}
                </div>
                {match.lastMessage ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                    {match.lastMessage.senderId === viewer.id ? "You: " : ""}
                    {match.lastMessage.content}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">
                    No messages yet. Break the ice.
                  </p>
                )}
                {match.otherUser.presence.currentlyPlaying ? (
                  <p className="mt-2 text-xs text-[var(--accent-2)]">
                    Playing {match.otherUser.presence.currentlyPlaying}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[var(--text-soft)]">
                    {match.otherUser.lastActiveLabel}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.otherUser.playstyles.slice(0, 2).map((tag) => (
                    <Tag key={tag.id}>{tag.tag}</Tag>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm leading-7 text-[var(--text-soft)]">
              No mutual likes yet. Head to Discover to start matching.
            </p>
          )}
        </div>
      </aside>

      <div className="space-y-6">
        <SessionFollowupCard prompts={sessionPrompts} />
        <section className="panel rounded-[2rem] p-6">
          {activeMatch ? (
            <>
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-3xl font-semibold text-white">
                Chat with {activeMatch.otherUser.username}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Lock in the queue fast and use the quick actions to get into a game.
              </p>
            </div>
            <div className="mt-5 max-h-[30rem] space-y-4 overflow-y-auto pr-1">
              {activeMatch.messages.map((message) => {
                const ownMessage = message.senderId === viewer.id;
                return (
                  <div
                    key={message.id}
                    className={`app-transition max-w-xl rounded-[1.5rem] px-4 py-3 ${
                      ownMessage
                        ? "ml-auto bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] text-slate-950"
                        : "border border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                );
              })}
            </div>
            <MessageComposer
              matchId={activeMatch.id}
              discordHandle={viewer.discordHandle}
              partyLink={viewer.partyLink}
            />
            </>
          ) : (
            <div className="py-16 text-center">
              <h1 className="text-3xl font-semibold text-white">No active conversations yet</h1>
              <p className="mt-3 text-[var(--text-soft)]">
                Mutual likes become matches, and matches unlock messages here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
