// Decompose a winning hand into 4-melds-plus-pair (or 7-pairs / 13-orphans) readings.
// Port of MahjongKit/Scoring/HandDecomposition.swift.

import { Hand, tilesToCounts } from './hand';
import { Tile, tileFromIndex, isHonor } from './tile';
import { isWinning } from './agari';

export type DecomposedMeldShape = 'chow' | 'pong' | 'kong';
export type DeclaredKind = 'chi' | 'pong' | 'openKong' | 'concealedKong' | 'addedKong' | null;

export type DecomposedMeld = {
  shape: DecomposedMeldShape;
  tiles: Tile[];
  declared: DeclaredKind;
  isConcealed: boolean;
};

export type WinningDecomposition =
  | { kind: 'standard'; melds: DecomposedMeld[]; pair: Tile }
  | { kind: 'sevenPairs'; melds: DecomposedMeld[]; pairs: Tile[] }
  | { kind: 'thirteenOrphans'; melds: DecomposedMeld[]; pair: Tile };

export function decomposeWinningHand(hand: Hand, winTile: Tile | null): WinningDecomposition[] {
  const concealed = winTile !== null ? [...hand.concealed, winTile] : [...hand.concealed];
  if (!isWinning({ concealed, melds: hand.melds })) return [];

  if (hand.melds.length === 0) {
    const counts = tilesToCounts(concealed);
    const orphansPair = thirteenOrphansPair(counts);
    if (orphansPair !== null) {
      return [{ kind: 'thirteenOrphans', melds: [], pair: orphansPair }];
    }
    const sp = sevenPairsTiles(counts);
    if (sp !== null) {
      return [{ kind: 'sevenPairs', melds: [], pairs: sp }];
    }
  }

  const declared: DecomposedMeld[] = hand.melds.map(m => {
    const shape: DecomposedMeldShape =
      m.kind === 'chi' ? 'chow' :
      m.kind === 'pong' ? 'pong' : 'kong';
    return {
      shape,
      tiles: [...m.tiles].sort((a, b) => a - b),
      declared: m.kind,
      isConcealed: m.kind === 'concealedKong',
    };
  });

  const concealedReadings = decomposeConcealed(concealed);
  return concealedReadings.map(r => ({
    kind: 'standard' as const,
    melds: [...declared, ...r.melds],
    pair: r.pair,
  }));
}

const TERMINALS_HONORS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

function thirteenOrphansPair(counts: number[]): Tile | null {
  let pair: Tile | null = null;
  for (let idx = 0; idx < 34; idx++) {
    const c = counts[idx]!;
    if (TERMINALS_HONORS.includes(idx)) {
      if (c === 1) continue;
      if (c === 2) {
        if (pair !== null) return null;
        pair = tileFromIndex(idx);
      } else return null;
    } else {
      if (c !== 0) return null;
    }
  }
  return pair;
}

function sevenPairsTiles(counts: number[]): Tile[] | null {
  const pairs: Tile[] = [];
  for (let idx = 0; idx < 34; idx++) {
    const c = counts[idx]!;
    if (c === 0) continue;
    if (c === 2) pairs.push(tileFromIndex(idx));
    else return null;
  }
  return pairs.length === 7 ? pairs : null;
}

function decomposeConcealed(tiles: Tile[]): Array<{ melds: DecomposedMeld[]; pair: Tile }> {
  const counts = tilesToCounts(tiles);
  const melds: DecomposedMeld[] = [];
  let pair: Tile | null = null;
  const results: Array<{ melds: DecomposedMeld[]; pair: Tile }> = [];

  function recurse(start: number): void {
    let idx = start;
    while (idx < 34 && counts[idx] === 0) idx++;
    if (idx === 34) {
      if (pair !== null) results.push({ melds: melds.slice(), pair });
      return;
    }
    const tile = tileFromIndex(idx);

    if (pair === null && counts[idx]! >= 2) {
      counts[idx]! -= 2;
      pair = tile;
      recurse(idx);
      pair = null;
      counts[idx]! += 2;
    }

    if (counts[idx]! >= 3) {
      counts[idx]! -= 3;
      melds.push({ shape: 'pong', tiles: [tile, tile, tile], declared: null, isConcealed: true });
      recurse(idx);
      melds.pop();
      counts[idx]! += 3;
    }

    if (!isHonor(tile)) {
      const suitStart = Math.floor(idx / 9) * 9;
      const suitEnd = suitStart + 8;
      if (idx + 2 <= suitEnd && counts[idx + 1]! > 0 && counts[idx + 2]! > 0) {
        const t1 = tileFromIndex(idx + 1);
        const t2 = tileFromIndex(idx + 2);
        counts[idx]!--; counts[idx + 1]!--; counts[idx + 2]!--;
        melds.push({ shape: 'chow', tiles: [tile, t1, t2], declared: null, isConcealed: true });
        recurse(idx);
        melds.pop();
        counts[idx]!++; counts[idx + 1]!++; counts[idx + 2]!++;
      }
    }
  }

  recurse(0);
  return results;
}
