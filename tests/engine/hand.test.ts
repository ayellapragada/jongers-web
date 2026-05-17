import { describe, it, expect } from 'vitest';
import {
  makeHand, makeMeld, concealedCounts, declaredMeldSlots, totalTileCount,
  isKong, MeldKind, parseHand,
} from '../../src/engine/hand';
import { man, pin, east } from '../../src/engine/tile';

describe('Hand', () => {
  it('concealedCounts is 34-length and sums to concealed count', () => {
    const h = makeHand([man(1), man(1), man(2), pin(3)]);
    const c = concealedCounts(h);
    expect(c.length).toBe(34);
    expect(c[0]).toBe(2);
    expect(c[1]).toBe(1);
    expect(c[11]).toBe(1);
    expect(c.reduce((a, b) => a + b)).toBe(4);
  });

  it('declaredMeldSlots = number of melds (kong still 1)', () => {
    const h = makeHand([], [
      makeMeld('pong', [east, east, east]),
      makeMeld('openKong', [man(1), man(1), man(1), man(1)]),
    ]);
    expect(declaredMeldSlots(h)).toBe(2);
  });

  it('totalTileCount sums concealed + meld tiles', () => {
    const h = makeHand([man(2), pin(3)], [
      makeMeld('pong', [east, east, east]),
      makeMeld('openKong', [man(1), man(1), man(1), man(1)]),
    ]);
    expect(totalTileCount(h)).toBe(2 + 3 + 4);
  });
});

describe('Meld.isKong', () => {
  it.each<[MeldKind, boolean]>([
    ['chi', false], ['pong', false],
    ['openKong', true], ['concealedKong', true], ['addedKong', true],
  ])('%s isKong=%s', (kind, expected) => {
    expect(isKong(makeMeld(kind, [man(1), man(1), man(1), man(1)]))).toBe(expected);
  });
});

describe('parseHand', () => {
  it('parses MPSZ into a Hand with no melds', () => {
    const h = parseHand('123m');
    expect(h.concealed).toEqual([man(1), man(2), man(3)]);
    expect(h.melds).toEqual([]);
  });
});
