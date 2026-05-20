import { describe, it, expect } from 'vitest';
import { standardShanten } from '../../src/engine/shanten';
import { parseHand } from '../../src/engine/hand';

// Canonical cases (mined from the Swift fixture set and the Python oracle).
// MPSZ strings; each is a 13-tile hand unless noted.
const CASES: Array<[string, number]> = [
  // Winning hands (14 tiles)
  ['123m456p789s11122z', -1],   // standard win
  ['11122233344455m', -1],       // 4 triplets + pair

  // Tenpai (13 tiles)
  ['123m456p789s1112z', 0],      // pair wait on 2z
  ['123m456p11789s11z', 0],      // tanki on something

  // 1-shanten and beyond
  ['13579m13579p1357s', 4],      // garbage hand, all isolated; 4 best partials max
];

describe('standardShanten — canonical', () => {
  for (const [mpsz, expected] of CASES) {
    it(`${mpsz} → ${expected}`, () => {
      const h = parseHand(mpsz);
      expect(standardShanten(h)).toBe(expected);
    });
  }
});

describe('standardShanten properties', () => {
  it('a confirmed-winning hand returns -1', () => {
    expect(standardShanten(parseHand('123m456p789s11122z'))).toBe(-1);
  });

  it('removing one tile from a winning hand bumps shanten ≥ 0', () => {
    // Drop "1z" from 11122z to get 11222z → no longer winning
    const h = parseHand('123m456p789s1122z');
    expect(standardShanten(h)).toBeGreaterThanOrEqual(0);
  });

  it('empty hand returns 0 (algorithm credits 4 implicit melds for the 14-tile budget)', () => {
    // Matches Swift implementation: initMentsu = (14 - 0) / 3 = 4 → retShanten = 8 - 8 = 0.
    expect(standardShanten(parseHand(''))).toBe(0);
  });
});
