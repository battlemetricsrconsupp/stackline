"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/_actions/auth";
import { BRAND } from "@/lib/brand";

const initialState: FormState = {};

type AuthFormProps = {
  title: string;
  subtitle: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    placeholder: string;
  }>;
  submitLabel: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  action,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="panel hud-frame w-full p-8">
      <div className="mb-8">
        <p className="hud-label mb-3 text-sm text-[var(--accent-2)]">
          {BRAND.accessLabel}
        </p>
        <h1 className="hero-title text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-soft)]">
          {subtitle}
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-2 block text-sm text-[var(--text-soft)]">
              {field.label}
            </span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              className="hud-frame w-full border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]/60"
              required
            />
            {state.errors?.[field.name] ? (
              <span className="mt-2 block text-sm text-[var(--danger)]">
                {state.errors[field.name]?.join(" ")}
              </span>
            ) : null}
          </label>
        ))}

        {state.message ? (
          <p className="hud-frame border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {state.message}
          </p>
        ) : null}

        <button
          disabled={pending}
          className="glow hud-frame w-full bg-[linear-gradient(135deg,#ff5c8a,#6ed6ff)] px-4 py-3 font-semibold text-slate-950 transition disabled:opacity-60"
        >
          {pending ? "Working..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
