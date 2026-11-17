/**
 * Accepts only same-origin relative paths for post-login redirects, preventing open redirects
 * through the `next` parameter (e.g. `//evil.example` or `https://evil.example`).
 */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return fallback;
  if (value.includes('\\')) return fallback;
  return value;
}
