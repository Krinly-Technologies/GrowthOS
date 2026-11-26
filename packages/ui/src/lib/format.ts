// Indian number and currency formatting. Hand-written (not Intl) so server and client render
// identical strings — no hydration mismatches across ICU versions.

/** Indian digit grouping: 342500 → "3,42,500". */
export function groupIndian(value: number): string {
  const negative = value < 0;
  const digits = Math.round(Math.abs(value)).toString();
  if (digits.length <= 3) return (negative ? '-' : '') + digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${rest},${last3}`;
}

/** ₹3,42,500. With `paise`, always two decimals: ₹3,42,500.50. */
export function formatINR(amount: number, options: { paise?: boolean } = {}): string {
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount);
  if (!options.paise) return `${sign}₹${groupIndian(abs)}`;
  const rupees = Math.trunc(abs);
  const paise = Math.round((abs - rupees) * 100)
    .toString()
    .padStart(2, '0');
  return `${sign}₹${groupIndian(rupees)}.${paise}`;
}

function trimZeros(value: string): string {
  return value.includes('.') ? value.replace(/\.?0+$/, '') : value;
}

/** Compact rupees for axes and dense labels: ₹3.43 L, ₹1.2 Cr, ₹6.5k. Pair with the exact value. */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 1e7) return `${sign}₹${trimZeros((abs / 1e7).toFixed(2))} Cr`;
  if (abs >= 1e5) return `${sign}₹${trimZeros((abs / 1e5).toFixed(2))} L`;
  if (abs >= 1e3) return `${sign}₹${trimZeros((abs / 1e3).toFixed(1))}k`;
  return `${sign}₹${groupIndian(abs)}`;
}

export function formatPercent(part: number, whole: number): string {
  if (whole === 0) return '–';
  return `${Math.round((part / whole) * 100).toString()}%`;
}

export function pluralize(count: number, one: string, many = `${one}s`): string {
  return `${count.toString()} ${count === 1 ? one : many}`;
}

/** Two-letter initials; the first grapheme for non-Latin (e.g. Devanagari, Tamil) names. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : '';
  if (!/^[\p{Script=Latin}]/u.test(first)) return Array.from(first)[0] ?? '?';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
