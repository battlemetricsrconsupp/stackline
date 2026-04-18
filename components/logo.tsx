import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span className="hud-frame relative flex h-11 w-11 items-center justify-center overflow-hidden border border-[var(--accent)]/25 bg-[var(--accent)]/12 font-mono text-sm font-semibold text-white">
        <span className="relative">{BRAND.mark}</span>
      </span>
      <span>
        <span className="block text-lg font-semibold tracking-[0.04em] text-white">
          {BRAND.name}
        </span>
        <span className="hud-label block text-[10px] text-[var(--text-soft)]">
          {BRAND.networkLabel}
        </span>
      </span>
    </Link>
  );
}
