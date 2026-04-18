import { saveProfileAction } from "@/app/_actions/profile";
import { ProfilePictureUploader } from "@/components/profile-picture-uploader";
import {
  LANGUAGE_OPTIONS,
  PLAYSTYLE_TAGS,
  PLAYTIME_OPTIONS,
  REGION_OPTIONS,
  getRankOptionsForGame,
} from "@/lib/config/catalog";

type GameOption = {
  slug: string;
  name: string;
};

type ExistingProfile = {
  username: string;
  age: number | null;
  region: string | null;
  timezone: string | null;
  bio: string | null;
  image: string | null;
  discordHandle: string | null;
  partyLink: string | null;
  onlineStatus: string;
  currentlyPlaying?: string | null;
  lookingForGroup: boolean;
  languages: string[];
  playstyles: string[];
  playTimes: string[];
  gameProfiles: Array<{ slug: string; rankLabel: string }>;
};

type Props = {
  profile?: ExistingProfile;
  games: GameOption[];
  submitLabel: string;
};

export function ProfileForm({ profile, games, submitLabel }: Props) {
  const selectedGames = new Map(
    profile?.gameProfiles.map((item) => [item.slug, item.rankLabel]) ?? []
  );

  return (
    <form action={saveProfileAction} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="panel rounded-[2rem] p-6">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Identity
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Build the teammate profile people will actually want to queue with
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Username
              </span>
              <input
                name="username"
                defaultValue={profile?.username}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Age</span>
              <input
                name="age"
                type="number"
                min={13}
                max={99}
                defaultValue={profile?.age ?? undefined}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Region
              </span>
              <select
                name="region"
                defaultValue={profile?.region ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
              >
                <option value="">Select region</option>
                {REGION_OPTIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Timezone
              </span>
              <input
                name="timezone"
                defaultValue={profile?.timezone ?? ""}
                placeholder="Europe/Oslo"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">Short bio</span>
            <textarea
              name="bio"
              defaultValue={profile?.bio ?? ""}
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              placeholder="Tell people what kind of teammate you are."
            />
          </label>
        </section>

        <section className="panel rounded-[2rem] p-6">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Games & Ranks
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Pick multiple games and set a different rank for each
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {games.map((game) => (
              <div
                key={game.slug}
                className="rounded-3xl border border-white/8 bg-white/4 p-4"
              >
                <label className="flex items-center gap-3 text-white">
                  <input
                    type="checkbox"
                    name="selectedGames"
                    value={game.slug}
                    defaultChecked={selectedGames.has(game.slug)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span>{game.name}</span>
                </label>
                <select
                  name={`rank_${game.slug}`}
                  defaultValue={selectedGames.get(game.slug) ?? "Unranked"}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3 text-sm"
                >
                  {getRankOptionsForGame(game.slug).map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <ProfilePictureUploader initialImage={profile?.image} />

        <section className="panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold text-white">Preferences</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            These are the things the match engine uses to find the right people.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-3 text-sm text-[var(--text-soft)]">Languages</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((language) => (
                  <label
                    key={language}
                    className="pill inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={language}
                      defaultChecked={profile?.languages.includes(language)}
                    />
                    {language}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-[var(--text-soft)]">Playstyle tags</p>
              <div className="flex flex-wrap gap-2">
                {PLAYSTYLE_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="pill inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      name="playstyles"
                      value={tag}
                      defaultChecked={profile?.playstyles.includes(tag)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-[var(--text-soft)]">Preferred play times</p>
              <div className="flex flex-wrap gap-2">
                {PLAYTIME_OPTIONS.map((slot) => (
                  <label
                    key={slot}
                    className="pill inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      name="playTimes"
                      value={slot}
                      defaultChecked={profile?.playTimes.includes(slot)}
                    />
                    {slot}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold text-white">Social & status</h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Currently playing
              </span>
              <input
                name="currentlyPlaying"
                defaultValue={profile?.currentlyPlaying ?? ""}
                placeholder="Valorant, CS2, or leave blank"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Discord handle
              </span>
              <input
                name="discordHandle"
                defaultValue={profile?.discordHandle ?? ""}
                placeholder="yourname#1234 or @handle"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Party / voice link
              </span>
              <input
                name="partyLink"
                defaultValue={profile?.partyLink ?? ""}
                placeholder="discord.gg/example"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">
                Status
              </span>
              <select
                name="onlineStatus"
                defaultValue={profile?.onlineStatus ?? "Online"}
                className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
              >
                <option>Online</option>
                <option>Away</option>
                <option>Offline</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white">
              <input
                type="checkbox"
                name="lookingForGroup"
                defaultChecked={profile?.lookingForGroup ?? true}
              />
              Show me in discover and search while I am looking for teammates
            </label>
          </div>
        </section>

        <button className="glow w-full rounded-[1.5rem] bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] px-5 py-4 font-semibold text-slate-950">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
