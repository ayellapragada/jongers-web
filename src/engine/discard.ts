import { Hand, makeHand, totalTileCount } from './hand';
import { Tile } from './tile';
import { standardShanten } from './shanten';
import { ukeire, UkeireResult } from './ukeire';

export type DiscardOption = {
  tile: Tile;
  resultingShanten: number;
  resultingUkeire: UkeireResult;
};

export function discardOptions(
  h: Hand,
  visible: ReadonlyMap<Tile, number> = new Map(),
): DiscardOption[] {
  if (totalTileCount(h) !== 14) {
    throw new Error(`discardOptions requires 14-tile hand; got ${totalTileCount(h)}`);
  }
  const unique = Array.from(new Set(h.concealed));
  const options: DiscardOption[] = [];
  for (const t of unique) {
    const idx = h.concealed.indexOf(t);
    const remaining = h.concealed.slice(0, idx).concat(h.concealed.slice(idx + 1));
    const candidate = makeHand(remaining, h.melds);
    const sh = standardShanten(candidate);
    const uk = sh >= 0 ? ukeire(candidate, visible) : { entries: [], totalRemaining: 0, kindCount: 0 };
    options.push({ tile: t, resultingShanten: sh, resultingUkeire: uk });
  }
  options.sort((a, b) => {
    if (a.resultingShanten !== b.resultingShanten) return a.resultingShanten - b.resultingShanten;
    return b.resultingUkeire.totalRemaining - a.resultingUkeire.totalRemaining;
  });
  return options;
}

// The "engine-best" set: all options tied for lowest shanten + highest ukeire total.
export function bestDiscards(options: readonly DiscardOption[]): DiscardOption[] {
  if (options.length === 0) return [];
  const top = options[0]!;
  return options.filter(o =>
    o.resultingShanten === top.resultingShanten &&
    o.resultingUkeire.totalRemaining === top.resultingUkeire.totalRemaining
  );
}
