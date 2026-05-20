import { Hand, concealedCounts, totalTileCount } from './hand';
import { Tile, ALL_TILES } from './tile';
import { standardShanten, regularShanten } from './shanten';

export type UkeireEntry = { tile: Tile; remaining: number };

export type UkeireResult = {
  entries: UkeireEntry[];           // sorted by tile index
  totalRemaining: number;
  kindCount: number;
};

const empty = (): UkeireResult => ({ entries: [], totalRemaining: 0, kindCount: 0 });

export function ukeire(h: Hand, visible: ReadonlyMap<Tile, number> = new Map()): UkeireResult {
  if (totalTileCount(h) !== 13) {
    throw new Error(`ukeire requires 13-tile hand; got ${totalTileCount(h)}`);
  }
  const baseShanten = standardShanten(h);
  if (baseShanten < 0) return empty();

  const handCounts = concealedCounts(h);
  const visibleCounts = new Array(34).fill(0);
  for (const [t, n] of visible) visibleCounts[t] += n;
  for (const m of h.melds) for (const t of m.tiles) visibleCounts[t]++;

  const entries: UkeireEntry[] = [];
  for (const t of ALL_TILES) {
    const seen = handCounts[t]! + visibleCounts[t]!;
    if (seen >= 4) continue;
    handCounts[t]!++;
    const cand = regularShanten(handCounts);
    handCounts[t]!--;
    if (cand < baseShanten) {
      entries.push({ tile: t, remaining: 4 - seen });
    }
  }
  return {
    entries,
    totalRemaining: entries.reduce((a, e) => a + e.remaining, 0),
    kindCount: entries.length,
  };
}
