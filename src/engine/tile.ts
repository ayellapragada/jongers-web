// 34-tile index. Branded number so callers can't pass arbitrary ints.
export type Tile = number & { readonly __brand: 'Tile' };

export type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';

export function tileFromIndex(i: number): Tile {
  if (!Number.isInteger(i) || i < 0 || i > 33) {
    throw new Error(`tile index out of range: ${i}`);
  }
  return i as Tile;
}

export function tileSuit(t: Tile): Suit {
  if (t <= 8) return 'man';
  if (t <= 17) return 'pin';
  if (t <= 26) return 'sou';
  if (t <= 30) return 'wind';
  return 'dragon';
}

export function tileNumber(t: Tile): number {
  if (t <= 8) return t + 1;
  if (t <= 17) return t - 9 + 1;
  if (t <= 26) return t - 18 + 1;
  if (t <= 30) return t - 27 + 1;
  return t - 31 + 1;
}

export function isHonor(t: Tile): boolean { return t >= 27; }

export function isTerminal(t: Tile): boolean {
  if (isHonor(t)) return false;
  const n = tileNumber(t);
  return n === 1 || n === 9;
}

export function isTerminalOrHonor(t: Tile): boolean {
  return isTerminal(t) || isHonor(t);
}

function check(n: number, lo: number, hi: number, label: string): void {
  if (!Number.isInteger(n) || n < lo || n > hi) {
    throw new Error(`${label} must be ${lo}..${hi}, got ${n}`);
  }
}

export function man(n: number): Tile { check(n, 1, 9, 'man'); return (n - 1) as Tile; }
export function pin(n: number): Tile { check(n, 1, 9, 'pin'); return (n - 1 + 9) as Tile; }
export function sou(n: number): Tile { check(n, 1, 9, 'sou'); return (n - 1 + 18) as Tile; }

export const east  = 27 as Tile;
export const south = 28 as Tile;
export const west  = 29 as Tile;
export const north = 30 as Tile;
export const white = 31 as Tile;
export const green = 32 as Tile;
export const red   = 33 as Tile;

export const ALL_TILES: readonly Tile[] = Array.from({ length: 34 }, (_, i) => i as Tile);
