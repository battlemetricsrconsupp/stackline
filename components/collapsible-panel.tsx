"use client";

import { ChevronDown } from "lucide-react";

export function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-white/8 bg-white/3 px-4 py-3"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white">
        <span className="text-sm font-medium text-white/92">{title}</span>
        <ChevronDown className="h-4 w-4 text-[var(--text-soft)] transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm leading-6 text-[var(--text-soft)]/95">{children}</div>
    </details>
  );
}
