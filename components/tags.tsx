export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="pill inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-wide text-[var(--text-soft)]">
      {children}
    </span>
  );
}
