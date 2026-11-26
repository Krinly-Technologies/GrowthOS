import { Icon } from '../components/icon';
import { formatINR, formatINRCompact } from '../lib/format';
import { cn } from '../lib/utils';

/**
 * A rupee amount with tabular figures and Indian grouping (₹3,01,000). `compact` shows ₹3.01L
 * visually but always announces the exact amount. Amounts are in rupees unless `paise` is set.
 */
function Money({
  amount,
  compact = false,
  paise = false,
  signed = false,
  className,
}: {
  amount: number;
  compact?: boolean;
  /** Show paise (₹1,250.50). */
  paise?: boolean;
  /** Prefix + for positive amounts (deltas). */
  signed?: boolean;
  className?: string;
}) {
  const exact = formatINR(amount, { paise });
  const shown = compact ? formatINRCompact(amount) : exact;
  const sign = signed && amount > 0 ? '+' : '';
  return (
    <span
      className={cn('tnum whitespace-nowrap', className)}
      {...(compact ? { 'aria-label': `${sign}${exact}`, title: exact } : {})}
    >
      {sign}
      {shown}
    </span>
  );
}

/**
 * Whether an amount has been confirmed. Meaning is carried by icon + text, never colour alone.
 * Labels are props because what counts as "verified" is a product rule, not a UI rule.
 */
function VerificationStatus({
  verified,
  verifiedLabel = 'Verified',
  unverifiedLabel = 'Not yet verified',
  tone = 'surface',
  className,
}: {
  verified: boolean;
  verifiedLabel?: string;
  unverifiedLabel?: string;
  tone?: 'surface' | 'on-brand';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap',
        verified
          ? tone === 'on-brand'
            ? 'text-verified-on-brand'
            : 'text-verified'
          : tone === 'on-brand'
            ? 'text-on-brand-2'
            : 'text-attention',
        className,
      )}
    >
      {verified ? (
        <Icon name="seal" size={16} />
      ) : (
        <span aria-hidden="true" className="inline-block size-2 rounded-full bg-attention-dot" />
      )}
      {verified ? verifiedLabel : unverifiedLabel}
    </span>
  );
}

/** Change against a comparison period: arrow + words, e.g. "↑ ₹2,12,000 more than last month". */
function Delta({
  value,
  comparisonLabel,
  format = (v) => formatINR(v),
  tone = 'surface',
  className,
}: {
  value: number;
  comparisonLabel: string;
  format?: (absolute: number) => string;
  tone?: 'surface' | 'on-brand';
  className?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold',
        tone === 'on-brand' ? 'bg-brand-raised text-on-brand' : 'bg-canvas-2 text-ink',
        className,
      )}
    >
      <Icon name={up ? 'arrow-up' : 'arrow-down'} size={14} />
      <span className="tnum">{format(Math.abs(value))}</span> {up ? 'more' : 'less'} than{' '}
      {comparisonLabel}
    </span>
  );
}

export { Delta, Money, VerificationStatus };
