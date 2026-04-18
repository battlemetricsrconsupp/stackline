import Link from "next/link";
import { signupAction } from "@/app/_actions/auth";
import { SignupForm } from "@/components/signup-form";
import { getCatalogData } from "@/lib/data";
import {
  LANGUAGE_OPTIONS,
  PLAYSTYLE_TAGS,
  REGION_OPTIONS,
} from "@/lib/config/catalog";

export default async function SignupPage() {
  const games = await getCatalogData();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
            Brand new start
          </p>
          <h1 className="mt-4 text-6xl font-semibold leading-tight text-white">
            Build a better first impression before you even hit discover.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
            New accounts now choose their core games, region, language, and
            playstyle first, so the next setup step feels fast and personal.
          </p>
        </div>
        <div>
          <SignupForm
            action={signupAction}
            games={games.map((game) => ({ slug: game.slug, name: game.name }))}
            regions={REGION_OPTIONS}
            languages={LANGUAGE_OPTIONS}
            playstyles={PLAYSTYLE_TAGS}
          />
          <p className="mt-4 text-center text-sm text-[var(--text-soft)]">
            Already have an account?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
