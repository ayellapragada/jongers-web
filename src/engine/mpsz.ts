import {
  Tile, tileSuit, tileNumber,
  man, pin, sou, east, south, west, north, white, green, red,
} from './tile';

export class MPSZParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MPSZParseError';
  }
}

const HONOR_BY_DIGIT: Record<number, Tile> = {
  1: east, 2: south, 3: west, 4: north,
  5: white, 6: green, 7: red,
};

export function parseMPSZ(input: string): Tile[] {
  const tiles: Tile[] = [];
  let pending: number[] = [];

  for (const ch of input) {
    if (/\s/.test(ch)) continue;
    if (ch >= '1' && ch <= '9') {
      pending.push(ch.charCodeAt(0) - '0'.charCodeAt(0));
      continue;
    }
    if (ch === '0') {
      throw new MPSZParseError(`invalid digit: ${ch}`);
    }
    if (pending.length === 0) {
      throw new MPSZParseError(`empty run before suit '${ch}'`);
    }
    switch (ch) {
      case 'm': for (const d of pending) tiles.push(man(d)); break;
      case 'p': for (const d of pending) tiles.push(pin(d)); break;
      case 's': for (const d of pending) tiles.push(sou(d)); break;
      case 'z':
        for (const d of pending) {
          const t = HONOR_BY_DIGIT[d];
          if (t === undefined) {
            throw new MPSZParseError(`honor out of range: ${d}z (must be 1z..7z)`);
          }
          tiles.push(t);
        }
        break;
      default:
        throw new MPSZParseError(`invalid suit letter: '${ch}'`);
    }
    pending = [];
  }

  if (pending.length > 0) {
    throw new MPSZParseError('trailing digits with no suit letter');
  }
  return tiles;
}

export function formatTile(t: Tile): string {
  const s = tileSuit(t);
  const n = tileNumber(t);
  switch (s) {
    case 'man':    return `${n}m`;
    case 'pin':    return `${n}p`;
    case 'sou':    return `${n}s`;
    case 'wind':   return `${n}z`;
    case 'dragon': return `${n + 4}z`;
  }
}

export function formatTiles(ts: readonly Tile[]): string {
  if (ts.length === 0) return '';
  let out = '';
  let runDigits = '';
  let runSuitChar: string | null = null;

  const flush = () => {
    if (runSuitChar !== null && runDigits.length > 0) {
      out += runDigits + runSuitChar;
    }
    runDigits = '';
    runSuitChar = null;
  };

  for (const t of ts) {
    const s = tileSuit(t);
    const n = tileNumber(t);
    const suitChar = (s === 'wind' || s === 'dragon') ? 'z' : s[0]!;
    const digit = (s === 'dragon') ? n + 4 : n;
    if (suitChar !== runSuitChar) {
      flush();
      runSuitChar = suitChar;
    }
    runDigits += String(digit);
  }
  flush();
  return out;
}
