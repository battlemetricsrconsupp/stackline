import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/app/_actions/auth";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="hud-label text-sm text-[var(--accent-2)]">
            Return to Queue
          </p>
          <h1 className="hero-title mt-4 text-6xl font-semibold leading-[0.95] text-white">
            Rejoin your stack, your comms, and your active matches.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
            Log back in to jump into live teammate scouting, message threads,
            and your current LFG presence without rebuilding your setup.
          </p>
          <div className="accent-divider mt-8 h-[3px] w-28 rounded-full" />
          <div className="mt-8 grid max-w-xl gap-3">
            {[
              "Mic-first duos and trios",
              "Rank-aware matchmaking",
              "Fast access to your open chats",
            ].map((item) => (
              <div key={item} className="hud-frame border border-white/10 bg-white/4 px-4 py-3 text-sm text-white">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <AuthForm
            title="Log in"
            subtitle={`Use your ${BRAND.name} account to get back into ranked-ready discovery, messages, and team invites.`}
            submitLabel="Log in"
            action={loginAction}
            fields={[
              {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "you@example.com",
              },
              {
                name: "password",
                label: "Password",
                type: "password",
                placeholder: "Your password",
              },
            ]}
          />
          <p className="mt-4 text-center text-sm text-[var(--text-soft)]">
            New here?{" "}
            <Link href="/signup" className="text-white underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
