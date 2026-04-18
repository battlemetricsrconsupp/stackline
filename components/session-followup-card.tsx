import { rateTeammateAction, respondToSessionPromptAction } from "@/app/_actions/engagement";

export function SessionFollowupCard({
  prompts,
}: {
  prompts: Array<{
    id: string;
    matchId: string | null;
    gameSlug: string | null;
    status: "PENDING" | "COMPLETED" | "NO_SHOW";
    otherUsername: string;
    alreadyRated: number;
  }>;
}) {
  if (!prompts.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <section key={prompt.id} className="panel rounded-[2rem] border border-[var(--accent)]/18 p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">
            Session follow-up
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            How did it go with {prompt.otherUsername}?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            Confirm whether you actually played together. If you did, leave a quick teammate rating
            so the community gets more reliable over time.
          </p>

          {prompt.status === "PENDING" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={respondToSessionPromptAction.bind(null, prompt.id, true)}>
                <button className="glow rounded-full bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] px-5 py-3 font-semibold text-slate-950">
                  Yes, we played
                </button>
              </form>
              <form action={respondToSessionPromptAction.bind(null, prompt.id, false)}>
                <button className="rounded-full border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-5 py-3 text-[var(--danger)]">
                  No-show / bad session
                </button>
              </form>
            </div>
          ) : null}

          {prompt.status === "COMPLETED" && !prompt.alreadyRated ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <form action={rateTeammateAction.bind(null, prompt.id, true)} className="flex flex-1 gap-3">
                  <input
                    name="note"
                    placeholder="Optional note"
                    className="flex-1 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                  />
                  <button className="rounded-full bg-emerald-400/90 px-5 py-3 font-semibold text-slate-950">
                    👍 Good teammate
                  </button>
                </form>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={rateTeammateAction.bind(null, prompt.id, false)} className="flex flex-1 gap-3">
                  <input
                    name="note"
                    placeholder="Optional note"
                    className="flex-1 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                  />
                  <button className="rounded-full border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-5 py-3 text-[var(--danger)]">
                    👎 Toxic / no comms / no-show
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
