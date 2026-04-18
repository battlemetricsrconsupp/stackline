import { getPresenceForUser } from "@/lib/activity";
import { updateSettingsAction } from "@/app/_actions/profile";
import { requireViewer } from "@/lib/auth";
import { LiveQueueToggle } from "@/components/live-queue-toggle";
import { getLiveQueue, getLookingNowState } from "@/lib/live-queue";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const [presence, lookingNowState, liveQueue] = await Promise.all([
    getPresenceForUser(viewer.id),
    getLookingNowState(viewer.id),
    getLiveQueue(viewer.id),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
      <section className="panel rounded-[2rem] p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Tune your visibility and social links
        </h1>
        <p className="mt-3 text-[var(--text-soft)]">
          These settings help you control whether you show up in discover and how others can invite you into a party.
        </p>
        <div className="mt-6">
          <LiveQueueToggle
            initialLookingNow={lookingNowState.isLookingNow}
            initialTotalLookingNow={liveQueue.totalLookingNow}
          />
        </div>
      </section>

      <form action={updateSettingsAction} className="panel rounded-[2rem] p-6">
        <div className="space-y-5">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white">
            <input type="checkbox" name="lookingForGroup" defaultChecked={viewer.lookingForGroup} />
            I am actively looking for teammates right now
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">Status</span>
            <select
              name="onlineStatus"
              defaultValue={presence.onlineStatus}
              className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
            >
              <option>Online</option>
              <option>Away</option>
              <option>Offline</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">
              Currently playing
            </span>
            <input
              name="currentlyPlaying"
              defaultValue={presence.currentlyPlaying ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">
              Discord handle
            </span>
            <input
              name="discordHandle"
              defaultValue={viewer.discordHandle ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">Party link</span>
            <input
              name="partyLink"
              defaultValue={viewer.partyLink ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
          </label>
          <button className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-950">
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
