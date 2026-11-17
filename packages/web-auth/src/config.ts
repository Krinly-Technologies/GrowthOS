// NEXT_PUBLIC_* values must be read with literal `process.env.X` access so Next.js can inline
// them into browser bundles. Only the publishable key is ever exposed; never the secret key.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
export const PUBLIC_CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL ?? '';

export function assertConfigured(): void {
  const missing = Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CORE_API_URL: PUBLIC_CORE_API_URL,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}
