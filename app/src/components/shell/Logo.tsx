export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect width="26" height="26" rx="7.5" fill="var(--accent)" />
        <path
          d="M17.2 8.6c-.9-1-2.3-1.6-4-1.6-2.5 0-4.2 1.3-4.2 3.2 0 4.2 8.4 2.5 8.4 6.3 0 1.9-1.8 3.2-4.3 3.2-1.8 0-3.3-.7-4.2-1.8"
          fill="none"
          stroke="var(--on-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && <span className="text-[14px] font-semibold tracking-[0.16em]">SAUVER</span>}
    </span>
  )
}
