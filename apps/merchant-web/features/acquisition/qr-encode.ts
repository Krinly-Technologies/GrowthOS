// A small QR Code encoder, written here rather than added as a dependency: the only thing the
// acquisition screens need is a scannable code for a short URL, and this is ~200 lines with no
// runtime cost beyond the module itself (the alternative pulls in a canvas-oriented package and
// another pinned version to keep inside pnpm's release-age policy).
//
// Byte mode, error-correction level M, versions 1–10 (up to 213 bytes) — comfortably more than a
// tracking URL needs. Follows ISO/IEC 18004: Reed–Solomon over GF(256) with primitive polynomial
// 0x11D, standard block interleaving, all eight data masks scored by the four penalty rules.

/* ── GF(256) ─────────────────────────────────────────────────────────────── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255] ?? 0;
}

function mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[((LOG[a] ?? 0) + (LOG[b] ?? 0)) % 255] ?? 0;
}

/** Generator polynomial of degree `degree`, highest power first. */
function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      // poly is highest power first: multiplying by (x + α^i) shifts into next[j] and scales
      // into next[j + 1].
      next[j] = (next[j] ?? 0) ^ (poly[j] ?? 0);
      next[j + 1] = (next[j + 1] ?? 0) ^ mul(poly[j] ?? 0, EXP[i] ?? 0);
    }
    poly = next;
  }
  return poly;
}

function remainder(data: readonly number[], degree: number): number[] {
  const gen = generator(degree);
  const out = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (out[0] ?? 0);
    out.shift();
    out.push(0);
    for (let i = 0; i < degree; i++) out[i] = (out[i] ?? 0) ^ mul(gen[i + 1] ?? 0, factor);
  }
  return out;
}

/* ── Version tables (error-correction level M) ───────────────────────────── */

interface VersionSpec {
  /** Bytes of payload the version holds in byte mode. */
  capacity: number;
  /** Error-correction codewords per block. */
  ecPerBlock: number;
  /** [blocks, data codewords per block] groups. */
  groups: readonly (readonly [number, number])[];
  /** Alignment-pattern centre coordinates. */
  alignment: readonly number[];
  /** 18-bit version information, for versions 7 and above. */
  versionBits?: number;
}

const VERSIONS: readonly VersionSpec[] = [
  { capacity: 14, ecPerBlock: 10, groups: [[1, 16]], alignment: [] },
  { capacity: 26, ecPerBlock: 16, groups: [[1, 28]], alignment: [6, 18] },
  { capacity: 42, ecPerBlock: 26, groups: [[1, 44]], alignment: [6, 22] },
  { capacity: 62, ecPerBlock: 18, groups: [[2, 32]], alignment: [6, 26] },
  { capacity: 84, ecPerBlock: 24, groups: [[2, 43]], alignment: [6, 30] },
  { capacity: 106, ecPerBlock: 16, groups: [[4, 27]], alignment: [6, 34] },
  {
    capacity: 122,
    ecPerBlock: 18,
    groups: [[4, 31]],
    alignment: [6, 22, 38],
    versionBits: 0x07c94,
  },
  {
    capacity: 152,
    ecPerBlock: 22,
    groups: [
      [2, 38],
      [2, 39],
    ],
    alignment: [6, 24, 42],
    versionBits: 0x085bc,
  },
  {
    capacity: 180,
    ecPerBlock: 22,
    groups: [
      [3, 36],
      [2, 37],
    ],
    alignment: [6, 26, 46],
    versionBits: 0x09a99,
  },
  {
    capacity: 213,
    ecPerBlock: 26,
    groups: [
      [4, 43],
      [1, 44],
    ],
    alignment: [6, 28, 50],
    versionBits: 0x0a4d3,
  },
];

/* ── Bit stream ──────────────────────────────────────────────────────────── */

class Bits {
  readonly values: number[] = [];
  push(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.values.push((value >>> i) & 1);
  }
  get length(): number {
    return this.values.length;
  }
}

function codewords(bytes: Uint8Array, version: number, spec: VersionSpec): number[] {
  const bits = new Bits();
  bits.push(0b0100, 4);
  bits.push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) bits.push(byte, 8);

  const dataCount = spec.groups.reduce((sum, [blocks, size]) => sum + blocks * size, 0);
  const capacityBits = dataCount * 8;
  bits.push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0, 1);

  const out: number[] = [];
  for (let i = 0; i < bits.values.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits.values[i + j] ?? 0);
    out.push(byte);
  }
  for (let pad = 0; out.length < dataCount; pad++) out.push(pad % 2 === 0 ? 0xec : 0x11);

  // Split into blocks, append Reed–Solomon parity, then interleave both halves.
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let at = 0;
  for (const [blocks, size] of spec.groups) {
    for (let b = 0; b < blocks; b++) {
      const block = out.slice(at, at + size);
      at += size;
      dataBlocks.push(block);
      ecBlocks.push(remainder(block, spec.ecPerBlock));
    }
  }
  const interleaved: number[] = [];
  const longest = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < longest; i++) {
    for (const block of dataBlocks) {
      const value = block[i];
      if (value !== undefined) interleaved.push(value);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const block of ecBlocks) interleaved.push(block[i] ?? 0);
  }
  return interleaved;
}

/* ── Module placement ────────────────────────────────────────────────────── */

type Grid = (boolean | null)[][];

function bch(value: number, poly: number, bits: number): number {
  let out = value << (bits - 1);
  const polyBits = 32 - Math.clz32(poly);
  while (32 - Math.clz32(out) >= polyBits) out ^= poly << (32 - Math.clz32(out) - polyBits);
  return out;
}

function placeFinder(grid: Grid, size: number): void {
  const corners: readonly (readonly [number, number])[] = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
  for (const [ox, oy] of corners) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        const row = grid[py];
        if (row) row[px] = ring !== 2 && ring <= 3;
      }
    }
  }
}

function placeAlignment(grid: Grid, centres: readonly number[], size: number): void {
  for (const cy of centres) {
    for (const cx of centres) {
      const nearFinder =
        (cx <= 8 && cy <= 8) || (cx <= 8 && cy >= size - 9) || (cx >= size - 9 && cy <= 8);
      if (nearFinder) continue;
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          const row = grid[cy + y];
          if (row) row[cx + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1;
        }
      }
    }
  }
}

function placeStatic(grid: Grid, size: number, spec: VersionSpec, version: number): void {
  placeFinder(grid, size);
  placeAlignment(grid, spec.alignment, size);
  for (let i = 8; i < size - 8; i++) {
    const even = i % 2 === 0;
    const row6 = grid[6];
    if (row6) row6[i] = even;
    const rowI = grid[i];
    if (rowI) rowI[6] = even;
  }
  // Dark module and the reserved format areas (filled in with the chosen mask later).
  const dark = grid[size - 8];
  if (dark) dark[8] = true;
  // The first format copy sits inside the top-left 9×9; the second is eight modules on row 8 at
  // the top right and eight on column 8 at the bottom left (the last of which is the dark module).
  for (let i = 0; i <= 8; i++) {
    reserve(grid, 8, i);
    reserve(grid, i, 8);
  }
  for (let i = 0; i <= 7; i++) {
    reserve(grid, size - 1 - i, 8);
    reserve(grid, 8, size - 1 - i);
  }
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      reserve(grid, a, b);
      reserve(grid, b, a);
    }
  }
}

function reserve(grid: Grid, x: number, y: number): void {
  const row = grid[y];
  if (row && row[x] === null) row[x] = false;
}

function placeData(grid: Grid, free: Grid, data: readonly number[], size: number): void {
  let bit = 0;
  const next = (): boolean => {
    const byte = data[bit >> 3] ?? 0;
    const value = ((byte >>> (7 - (bit % 8))) & 1) === 1;
    bit++;
    return value;
  };
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    // The vertical timing pattern occupies column 6, so the pair there shifts one to the left.
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if (free[y]?.[x] !== null) continue;
        const row = grid[y];
        if (row) row[x] = bit < data.length * 8 ? next() : false;
      }
    }
    upward = !upward;
  }
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function penalty(grid: readonly (readonly boolean[])[], size: number): number {
  let score = 0;
  const run = (line: readonly boolean[]) => {
    let length = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) {
        length++;
        if (length === 5) score += 3;
        else if (length > 5) score += 1;
      } else length = 1;
    }
  };
  for (let i = 0; i < size; i++) {
    run(grid[i] ?? []);
    run(grid.map((row) => row[i] ?? false));
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const a = grid[y]?.[x];
      if (a === grid[y]?.[x + 1] && a === grid[y + 1]?.[x] && a === grid[y + 1]?.[x + 1])
        score += 3;
    }
  }
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const hasPattern = (line: readonly boolean[], at: number) =>
    pattern.every((want, i) => line[at + i] === want);
  const reversed = [...pattern].reverse();
  const hasReversed = (line: readonly boolean[], at: number) =>
    reversed.every((want, i) => line[at + i] === want);
  for (let i = 0; i < size; i++) {
    const row = grid[i] ?? [];
    const column = grid.map((r) => r[i] ?? false);
    for (let at = 0; at <= size - 11; at++) {
      if (hasPattern(row, at) || hasReversed(row, at)) score += 40;
      if (hasPattern(column, at) || hasReversed(column, at)) score += 40;
    }
  }
  const dark = grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

function applyFormat(grid: Grid, size: number, mask: number): void {
  // Error-correction level M is 0b00, so the five data bits are the mask alone.
  const bits = ((mask << 10) | bch(mask, 0b10100110111, 11)) ^ 0x5412;
  const at = (i: number): boolean => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(grid, 8, i, at(i));
  set(grid, 8, 7, at(6));
  set(grid, 8, 8, at(7));
  set(grid, 7, 8, at(8));
  for (let i = 9; i <= 14; i++) set(grid, 14 - i, 8, at(i));
  for (let i = 0; i <= 7; i++) set(grid, size - 1 - i, 8, at(i));
  for (let i = 8; i <= 14; i++) set(grid, 8, size - 15 + i, at(i));
}

function applyVersion(grid: Grid, size: number, versionBits: number): void {
  for (let i = 0; i < 18; i++) {
    const on = ((versionBits >>> i) & 1) === 1;
    const a = Math.floor(i / 3);
    const b = (i % 3) + size - 11;
    set(grid, b, a, on);
    set(grid, a, b, on);
  }
}

function set(grid: Grid, x: number, y: number, value: boolean): void {
  const row = grid[y];
  if (row) row[x] = value;
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export interface QrMatrix {
  size: number;
  /** Row-major; true is a dark module. */
  modules: readonly (readonly boolean[])[];
  version: number;
}

/**
 * Encodes `text` as a QR Code at error-correction level M. Throws when the text is longer than
 * version 10 holds (213 bytes) — callers pass short URLs.
 */
export function encodeQr(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text);
  const index = VERSIONS.findIndex((spec) => bytes.length <= spec.capacity);
  if (index < 0) throw new Error(`QR payload too long: ${bytes.length} bytes`);
  const version = index + 1;
  const spec = VERSIONS[index];
  if (!spec) throw new Error(`No QR specification for version ${version}`);
  const size = 17 + version * 4;
  const data = codewords(bytes, version, spec);

  const base: Grid = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
  placeStatic(base, size, spec, version);
  const free: Grid = base.map((row) => [...row]);
  placeData(base, free, data, size);

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < MASKS.length; mask++) {
    const apply = MASKS[mask];
    if (!apply) continue;
    const candidate: Grid = base.map((row) => [...row]);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (free[y]?.[x] === null && apply(x, y)) {
          const row = candidate[y];
          if (row) row[x] = !(row[x] ?? false);
        }
      }
    }
    applyFormat(candidate, size, mask);
    if (spec.versionBits !== undefined) applyVersion(candidate, size, spec.versionBits);
    const solid = candidate.map((row) => row.map((cell) => cell ?? false));
    const score = penalty(solid, size);
    if (score < bestScore) {
      bestScore = score;
      best = solid;
    }
  }
  if (!best) throw new Error('QR masking failed');
  return { size, modules: best, version };
}

/**
 * The matrix as one SVG path (one `M…h1v1h-1z` per dark module), which keeps the markup small
 * and scales to any size. The viewBox is `0 0 size+2*quiet size+2*quiet`.
 */
export function qrPath(matrix: QrMatrix, quiet = 2): string {
  const parts: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.modules[y];
    if (!row) continue;
    for (let x = 0; x < matrix.size; x++) {
      if (row[x]) parts.push(`M${x + quiet},${y + quiet}h1v1h-1z`);
    }
  }
  return parts.join('');
}
