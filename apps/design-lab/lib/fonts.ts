import {
  Anek_Devanagari,
  Anek_Latin,
  Anek_Tamil,
  Atkinson_Hyperlegible_Next,
  Bricolage_Grotesque,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  Instrument_Sans,
  Manrope,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Plus_Jakarta_Sans,
} from 'next/font/google';

// All families are SIL Open Font License 1.1 (verified: google/fonts `ofl/<family>/OFL.txt`).
// next/font self-hosts them from the dev server; the browser never contacts Google.

// Concept A — Quiet Intelligence (Anek Latin for text and figures; see /type for why)
export const anekLatin = Anek_Latin({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-anek',
  display: 'swap',
});
export const anekDevanagari = Anek_Devanagari({
  subsets: ['devanagari'],
  axes: ['wdth'],
  variable: '--font-anek-deva',
  display: 'swap',
  preload: false,
});
export const anekTamil = Anek_Tamil({
  subsets: ['tamil'],
  axes: ['wdth'],
  variable: '--font-anek-tamil',
  display: 'swap',
  preload: false,
});

// Concept B — Growth Studio
export const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
});
export const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz', 'wdth'],
  variable: '--font-bricolage',
  display: 'swap',
});
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto-deva',
  display: 'swap',
  preload: false,
});
export const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  variable: '--font-noto-tamil',
  display: 'swap',
  preload: false,
});

// Comparison-only pairings on /type
/** Rejected for Concept A: measured on /type, it has no rupee (₹) glyph. */
export const instrumentSans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-instrument',
  display: 'swap',
  preload: false,
});
export const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
});
export const plexDevanagari = IBM_Plex_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-deva',
  display: 'swap',
  preload: false,
});
export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: false,
});
export const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-atkinson',
  display: 'swap',
  preload: false,
});

export const fontVariables = [
  instrumentSans,
  anekLatin,
  anekDevanagari,
  anekTamil,
  manrope,
  bricolage,
  notoDevanagari,
  notoTamil,
  plexSans,
  plexDevanagari,
  jakarta,
  atkinson,
]
  .map((font) => font.variable)
  .join(' ');
