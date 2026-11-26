// Palette data for the /type exploration. Keep in sync with concepts/a/a.css and concepts/b/b.css.

export interface Swatch {
  name: string;
  hex: string;
  role: string;
}

export interface Palette {
  concept: 'A' | 'B';
  title: string;
  brand: Swatch[];
  neutral: Swatch[];
  semantic: Swatch[];
  /** Foreground/background pairs that carry text or meaning in the concept. */
  pairs: { fg: string; bg: string; label: string }[];
}

const SEMANTIC: Swatch[] = [
  { name: 'Verified', hex: '#0B6E78', role: 'Verified money only — teal, never the brand green' },
  { name: 'Verified tint', hex: '#DDF0F1', role: 'Background for verified states' },
  { name: 'Attention', hex: '#8A5300', role: 'Due today, waiting for a reply' },
  { name: 'Attention tint', hex: '#FCEFD6', role: 'Background for attention states' },
  { name: 'Critical', hex: '#B42318', role: 'Overdue, failed, lost' },
  { name: 'Critical tint', hex: '#FDE6E2', role: 'Background for critical states' },
];

export const PALETTES: Palette[] = [
  {
    concept: 'A',
    title: 'Quiet Intelligence',
    brand: [
      { name: 'Ink', hex: '#111C2D', role: 'Text, primary actions, the monogram' },
      { name: 'Mint', hex: '#A8E6BF', role: 'Fill only: the active node, today’s marker' },
      { name: 'Growth green', hex: '#287D57', role: 'The Thread’s reached segments, focus ring' },
    ],
    neutral: [
      { name: 'Canvas', hex: '#F5F6F4', role: 'Page and navigation' },
      { name: 'Surface', hex: '#FFFFFF', role: 'Interactive layers: tables, sheets, menus' },
      { name: 'Line', hex: '#DFE3DE', role: 'Hairlines and rules' },
      { name: 'Ink 2', hex: '#3A4555', role: 'Secondary text' },
      { name: 'Ink 3', hex: '#5C6676', role: 'Muted text and metadata' },
    ],
    semantic: SEMANTIC,
    pairs: [
      { fg: '#111C2D', bg: '#F5F6F4', label: 'Ink on canvas' },
      { fg: '#5C6676', bg: '#F5F6F4', label: 'Ink 3 on canvas' },
      { fg: '#5C6676', bg: '#FFFFFF', label: 'Ink 3 on surface' },
      { fg: '#287D57', bg: '#FFFFFF', label: 'Growth green on surface' },
      { fg: '#287D57', bg: '#F5F6F4', label: 'Growth green on canvas' },
      { fg: '#111C2D', bg: '#A8E6BF', label: 'Ink on mint' },
      { fg: '#A8E6BF', bg: '#FFFFFF', label: 'Mint on surface (fill only)' },
      { fg: '#0B6E78', bg: '#DDF0F1', label: 'Verified on its tint' },
      { fg: '#8A5300', bg: '#FCEFD6', label: 'Attention on its tint' },
      { fg: '#B42318', bg: '#FDE6E2', label: 'Critical on its tint' },
    ],
  },
  {
    concept: 'B',
    title: 'Growth Studio',
    brand: [
      { name: 'Ink', hex: '#111C2D', role: 'The studio backdrop and rail' },
      { name: 'Ink raised', hex: '#1C2A40', role: 'Hover and selected rail items, hero panel' },
      { name: 'Mint', hex: '#A8E6BF', role: 'The brand voice on ink: Create, figures, the Flow' },
      { name: 'Growth green', hex: '#287D57', role: 'Emphasis on light sheets, focus ring' },
    ],
    neutral: [
      { name: 'Sheet', hex: '#F4F6F3', role: 'The raised working sheet' },
      { name: 'Surface', hex: '#FFFFFF', role: 'Cards, tiles, panels' },
      { name: 'Line', hex: '#E0E5DF', role: 'Dividers' },
      { name: 'On ink', hex: '#EEF2F7', role: 'Text on the backdrop' },
      { name: 'On ink muted', hex: '#A3AFC0', role: 'Secondary text on the backdrop' },
    ],
    semantic: SEMANTIC,
    pairs: [
      { fg: '#EEF2F7', bg: '#111C2D', label: 'On ink on ink' },
      { fg: '#A3AFC0', bg: '#111C2D', label: 'On ink muted on ink' },
      { fg: '#A8E6BF', bg: '#111C2D', label: 'Mint on ink' },
      { fg: '#A8E6BF', bg: '#1C2A40', label: 'Mint on ink raised' },
      { fg: '#111C2D', bg: '#A8E6BF', label: 'Ink on mint (Create button)' },
      { fg: '#111C2D', bg: '#F4F6F3', label: 'Ink on sheet' },
      { fg: '#5C6676', bg: '#FFFFFF', label: 'Muted text on surface' },
      { fg: '#287D57', bg: '#FFFFFF', label: 'Growth green on surface' },
      { fg: '#0B6E78', bg: '#DDF0F1', label: 'Verified on its tint' },
      { fg: '#8A5300', bg: '#FCEFD6', label: 'Attention on its tint' },
    ],
  },
];
