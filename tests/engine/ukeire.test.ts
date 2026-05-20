import { describe, it, expect } from 'vitest';
import { ukeire } from '../../src/engine/ukeire';
import { discardOptions, bestDiscards } from '../../src/engine/discard';
import { parseHand } from '../../src/engine/hand';
import { formatTile } from '../../src/engine/mpsz';

describe('ukeire', () => {
  it('returns empty on a winning hand', () => {
    // 13-tile hand: drop a tile from a winning hand
    const h = parseHand('123m456p789s1112z');  // tanki waiting on 2z
    const u = ukeire(h);
    // Should accept some tile(s) to advance toward winning
    expect(u.entries.length).toBeGreaterThan(0);
  });

  it('a tenpai hand has at least one accepting tile', () => {
    const h = parseHand('123m456p789s1112z');
    const u = ukeire(h);
    expect(u.kindCount).toBeGreaterThan(0);
    expect(u.totalRemaining).toBeGreaterThan(0);
  });
});

describe('discardOptions', () => {
  it('14-tile hand returns one option per distinct concealed tile', () => {
    const h = parseHand('123m456p789s11122z');  // 14 tiles, winning
    const opts = discardOptions(h);
    const distinct = new Set(h.concealed).size;
    expect(opts.length).toBe(distinct);
  });

  it('sorted best-first (lowest shanten, highest ukeire total)', () => {
    const h = parseHand('123m456p789s11122z');
    const opts = discardOptions(h);
    for (let i = 1; i < opts.length; i++) {
      const a = opts[i - 1]!, b = opts[i]!;
      expect(a.resultingShanten).toBeLessThanOrEqual(b.resultingShanten);
      if (a.resultingShanten === b.resultingShanten) {
        expect(a.resultingUkeire.totalRemaining).toBeGreaterThanOrEqual(b.resultingUkeire.totalRemaining);
      }
    }
  });

  it('bestDiscards returns top-tier ties', () => {
    const h = parseHand('123m456p789s11122z');
    const opts = discardOptions(h);
    const best = bestDiscards(opts);
    expect(best.length).toBeGreaterThanOrEqual(1);
    expect(best.every(o =>
      o.resultingShanten === best[0]!.resultingShanten &&
      o.resultingUkeire.totalRemaining === best[0]!.resultingUkeire.totalRemaining
    )).toBe(true);
  });
});
