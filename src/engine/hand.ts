import { Tile } from './tile';
import { parseMPSZ } from './mpsz';

export type MeldKind = 'chi' | 'pong' | 'openKong' | 'concealedKong' | 'addedKong';

export type Meld = {
  readonly kind: MeldKind;
  readonly tiles: readonly Tile[];
};

export function makeMeld(kind: MeldKind, tiles: readonly Tile[]): Meld {
  return { kind, tiles };
}

export function isKong(m: Meld): boolean {
  return m.kind === 'openKong' || m.kind === 'concealedKong' || m.kind === 'addedKong';
}

export type Hand = {
  readonly concealed: readonly Tile[];
  readonly melds: readonly Meld[];
};

export function makeHand(concealed: readonly Tile[], melds: readonly Meld[] = []): Hand {
  return { concealed, melds };
}

export function parseHand(notation: string, melds: readonly Meld[] = []): Hand {
  return makeHand(parseMPSZ(notation), melds);
}

export function tilesToCounts(tiles: readonly Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const t of tiles) counts[t]++;
  return counts;
}

export function concealedCounts(h: Hand): number[] {
  return tilesToCounts(h.concealed);
}

export function declaredMeldSlots(h: Hand): number {
  return h.melds.length;
}

export function totalTileCount(h: Hand): number {
  let n = h.concealed.length;
  for (const m of h.melds) n += m.tiles.length;
  return n;
}
