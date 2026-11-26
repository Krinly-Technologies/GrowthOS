import {
  Bricolage_Grotesque,
  Manrope,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
} from 'next/font/google';

// Self-hosted by next/font (the browser never contacts Google). SIL OFL 1.1 — see
// apps/design-lab/RESEARCH.md for the licence check. Matches docs/frontend/design-system.md.

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

export const fontVariables = [manrope, bricolage, notoDevanagari, notoTamil]
  .map((font) => font.variable)
  .join(' ');
