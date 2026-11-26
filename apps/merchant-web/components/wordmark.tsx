// Krinly's mark: a mint growth curve on navy. `tone="on-brand"` for the navy shell/sidebar,
// `tone="ink"` for light surfaces (auth, loading states).
export function Wordmark({
  compact = false,
  tone = 'ink',
  className,
}: {
  compact?: boolean;
  tone?: 'ink' | 'on-brand';
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${tone === 'on-brand' ? 'text-on-brand' : 'text-ink'} ${className ?? ''}`}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="8" fill="var(--accent)" />
        <path
          d="M6 18.5c3.5 0 4.5-7 8-7s3 3.5 6 3.5"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="15" r="2.2" fill="var(--brand)" />
      </svg>
      {compact ? (
        <span className="sr-only">Krinly</span>
      ) : (
        <span className="font-display text-[19px] leading-none font-semibold tracking-tight">
          Krinly
        </span>
      )}
    </span>
  );
}
