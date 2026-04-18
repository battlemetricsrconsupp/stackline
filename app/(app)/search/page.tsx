import { SearchPlayerCard } from "@/components/search-player-card";
import { getCatalogData, searchPlayers } from "@/lib/data";
import { requireViewer } from "@/lib/auth";
import {
  LANGUAGE_OPTIONS,
  PLAYSTYLE_TAGS,
  REGION_OPTIONS,
  RANK_OPTIONS,
  getRankOptionsForGame,
} from "@/lib/config/catalog";

export default async function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireViewer();
  const [games, searchParams] = await Promise.all([getCatalogData(), props.searchParams]);

  const results = await searchPlayers(
    {
      game: typeof searchParams.game === "string" ? searchParams.game : undefined,
      rank: typeof searchParams.rank === "string" ? searchParams.rank : undefined,
      language:
        typeof searchParams.language === "string" ? searchParams.language : undefined,
      region:
        typeof searchParams.region === "string" ? searchParams.region : undefined,
      playstyle:
        typeof searchParams.playstyle === "string" ? searchParams.playstyle : undefined,
      minAge:
        typeof searchParams.minAge === "string" ? Number(searchParams.minAge) : undefined,
      maxAge:
        typeof searchParams.maxAge === "string" ? Number(searchParams.maxAge) : undefined,
    },
    viewer.id
  );

  const selectedGame = typeof searchParams.game === "string" ? searchParams.game : "";
  const rankOptions = selectedGame ? getRankOptionsForGame(selectedGame) : RANK_OPTIONS;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[18rem_1fr]">
      <aside className="panel rounded-[2rem] p-6 xl:sticky xl:top-24 xl:self-start">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Search</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Find by filters</h1>
        <form className="mt-5 space-y-4">
          <select
            name="game"
            defaultValue={typeof searchParams.game === "string" ? searchParams.game : ""}
            className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
          >
            <option value="">Any game</option>
            {games.map((game) => (
              <option key={game.id} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>
          <select
            name="rank"
            defaultValue={typeof searchParams.rank === "string" ? searchParams.rank : ""}
            className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
          >
            <option value="">Any rank</option>
            {rankOptions.map((rank) => (
              <option key={rank}>{rank}</option>
            ))}
          </select>
          <select
            name="language"
            defaultValue={
              typeof searchParams.language === "string" ? searchParams.language : ""
            }
            className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
          >
            <option value="">Any language</option>
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
          <select
            name="region"
            defaultValue={typeof searchParams.region === "string" ? searchParams.region : ""}
            className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
          >
            <option value="">Any region</option>
            {REGION_OPTIONS.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
          <select
            name="playstyle"
            defaultValue={
              typeof searchParams.playstyle === "string" ? searchParams.playstyle : ""
            }
            className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3"
          >
            <option value="">Any playstyle</option>
            {PLAYSTYLE_TAGS.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="minAge"
              type="number"
              placeholder="Min age"
              defaultValue={typeof searchParams.minAge === "string" ? searchParams.minAge : ""}
              className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
            <input
              name="maxAge"
              type="number"
              placeholder="Max age"
              defaultValue={typeof searchParams.maxAge === "string" ? searchParams.maxAge : ""}
              className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
          </div>
          <button className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950">
            Apply filters
          </button>
        </form>
      </aside>

      <section className="space-y-4">
        <section className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Results</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Scan fast</h2>
          <p className="mt-3 text-[var(--text-soft)]">
            Short cards first. Expand only when you want more details.
          </p>
        </section>

        {results.length ? (
          results.map((player) => <SearchPlayerCard key={player.id} player={player} />)
        ) : (
          <div className="panel rounded-[2rem] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Closest players instead
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">No exact matches</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--text-soft)]">
              Try widening your rank range, changing the game filter, or turning on
              <span className="font-semibold text-white"> Looking now</span> so active players can
              find you faster.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
