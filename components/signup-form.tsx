"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/_actions/auth";
import { BRAND } from "@/lib/brand";

const initialState: FormState = {};

type GameOption = {
  slug: string;
  name: string;
};

type SignupFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  games: GameOption[];
  regions: readonly string[];
  languages: readonly string[];
  playstyles: readonly string[];
};

function isSelected(value: string, selected?: string | string[]) {
  return Array.isArray(selected) ? selected.includes(value) : false;
}

function ErrorText({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  if (!errors?.[name]?.length) {
    return null;
  }

  return (
    <span className="mt-2 block text-sm text-[var(--danger)]">
      {errors[name]?.join(" ")}
    </span>
  );
}

export function SignupForm({
  action,
  games,
  regions,
  languages,
  playstyles,
}: SignupFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="panel w-full rounded-[2rem] p-8">
      <div className="mb-8">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
          {BRAND.accessLabel}
        </p>
        <h1 className="text-3xl font-semibold text-white">Create your account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
          Pick a few things now so your teammate profile starts with real
          preferences, not an empty shell.
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        <section className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Account basics
            </p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Create your login and set the core details that shape your match feed.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={typeof state.values?.email === "string" ? state.values.email : ""}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
                required
              />
              <ErrorText errors={state.errors} name="email" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Username</span>
              <input
                name="username"
                placeholder="NovaPulse"
                defaultValue={typeof state.values?.username === "string" ? state.values.username : ""}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
                required
              />
              <ErrorText errors={state.errors} name="username" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Password</span>
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
                required
              />
              <ErrorText errors={state.errors} name="password" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Age</span>
              <input
                name="age"
                type="number"
                min={13}
                max={99}
                placeholder="Optional"
                defaultValue={typeof state.values?.age === "string" ? state.values.age : ""}
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
              />
              <ErrorText errors={state.errors} name="age" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Region</span>
              <select
                name="region"
                defaultValue={typeof state.values?.region === "string" ? state.values.region : ""}
                className="w-full rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-3 text-white"
                required
              >
                <option value="">Select region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <ErrorText errors={state.errors} name="region" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-soft)]">Timezone</span>
              <input
                name="timezone"
                placeholder="Europe/Oslo"
                defaultValue={
                  typeof state.values?.timezone === "string"
                    ? state.values.timezone
                    : Intl.DateTimeFormat().resolvedOptions().timeZone
                }
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
                required
              />
              <ErrorText errors={state.errors} name="timezone" />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Communication
            </p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Pick how you talk and the vibe you want in your squad.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm text-[var(--text-soft)]">Languages, up to 3</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {languages.map((language) => (
                <label
                  key={language}
                  className="pill flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:border-[var(--accent)]/40"
                >
                  <input
                    type="checkbox"
                    name="languages"
                    value={language}
                    defaultChecked={isSelected(language, state.values?.languages)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  {language}
                </label>
              ))}
            </div>
            <ErrorText errors={state.errors} name="languages" />
          </div>

          <div>
            <p className="mb-3 text-sm text-[var(--text-soft)]">Playstyle, up to 3</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {playstyles.map((tag) => (
                <label
                  key={tag}
                  className="pill flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:border-[var(--accent)]/40"
                >
                  <input
                    type="checkbox"
                    name="playstyles"
                    value={tag}
                    defaultChecked={isSelected(tag, state.values?.playstyles)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  {tag}
                </label>
              ))}
            </div>
            <ErrorText errors={state.errors} name="playstyles" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Starter games
            </p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Choose a few games now. You can set exact ranks and add more games next.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {games.map((game) => (
              <label
                key={game.slug}
                className="pill flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:border-[var(--accent)]/40"
              >
                <input
                  type="checkbox"
                  name="selectedGames"
                  value={game.slug}
                  defaultChecked={isSelected(game.slug, state.values?.selectedGames)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                {game.name}
              </label>
            ))}
          </div>
          <ErrorText errors={state.errors} name="selectedGames" />
        </section>

        {state.message ? (
          <p className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {state.message}
          </p>
        ) : null}

        <button
          disabled={pending}
          className="glow w-full rounded-2xl bg-[linear-gradient(135deg,#7cf1d5,#64b7ff)] px-4 py-3 font-semibold text-slate-950 transition disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Continue to profile setup"}
        </button>
      </form>
    </div>
  );
}
