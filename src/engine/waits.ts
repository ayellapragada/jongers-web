// Wait-shape classification for tenpai hands. Port of WaitDetection.swift.

import { Hand, concealedCounts } from './hand';
import { Tile, tileNumber, isHonor } from './tile';
import { standardShanten } from './shanten';
import { ukeire } from './ukeire';
import type { WaitShape } from '../scenarios/schema';

export type Wait = {
  tile: Tile;
  shapes: Set<WaitShape>;
};

export function waits(h: Hand): Wait[] {
  if (standardShanten(h) !== 0) return [];
  const u = ukeire(h);
  const counts = concealedCounts(h);
  return u.entries
    .slice()
    .sort((a, b) => a.tile - b.tile)
    .map(e => ({ tile: e.tile, shapes: inferShapes(e.tile, counts) }));
}

function inferShapes(tile: Tile, counts: number[]): Set<WaitShape> {
  const shapes = new Set<WaitShape>();
  const inHand = counts[tile]!;
  const number = tileNumber(tile);

  if (inHand === 1) shapes.add('tanki');

  if (inHand === 2) {
    for (let i = 0; i < 34; i++) {
      if (i !== tile && counts[i] === 2) { shapes.add('shanpon'); break; }
    }
  }

  if (!isHonor(tile)) {
    const suitStart = tile - (number - 1);
    const c = (n: number) => {
      if (n < 1 || n > 9) return 0;
      return counts[suitStart + n - 1]!;
    };

    const isPenchanLow  = (number === 3 && c(1) >= 1 && c(2) >= 1);
    const isPenchanHigh = (number === 7 && c(8) >= 1 && c(9) >= 1);
    if (isPenchanLow || isPenchanHigh) shapes.add('penchan');

    if (number >= 2 && number <= 8 && c(number - 1) >= 1 && c(number + 1) >= 1) {
      shapes.add('kanchan');
    }

    if (number >= 2 && number <= 8) {
      if (c(number + 1) >= 1 && c(number + 2) >= 1 && !isPenchanHigh) shapes.add('ryanmen');
      if (c(number - 1) >= 1 && c(number - 2) >= 1 && !isPenchanLow)  shapes.add('ryanmen');
    }

    if (inHand === 0) {
      if (c(number + 1) >= 1 && c(number + 2) >= 1 && c(number + 3) >= 1) shapes.add('nobetan');
      if (c(number - 1) >= 1 && c(number - 2) >= 1 && c(number - 3) >= 1) shapes.add('nobetan');
    }
  }

  if (shapes.size === 0) shapes.add('tanki');
  return shapes;
}
