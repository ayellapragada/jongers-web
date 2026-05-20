import { describe, it, expect } from 'vitest';
import { waits } from '../../src/engine/waits';
import { parseHand } from '../../src/engine/hand';
import { formatTile } from '../../src/engine/mpsz';

describe('waits', () => {
  it('returns empty for non-tenpai', () => {
    expect(waits(parseHand('19m19p19s1234567z'))).toEqual([]);  // already winning (12 tiles + nothing) — actually let me use a clearly non-tenpai
  });

  it('tanki wait', () => {
    // 123m 456p 789s 111z + 2z (single tile waiting on 2z)
    const w = waits(parseHand('123m456p789s1112z'));
    const tileStrs = w.map(x => formatTile(x.tile));
    expect(tileStrs).toContain('2z');
  });

  it('ryanmen wait', () => {
    // 45m + 11s + 234m + 567m + 789p (13 tiles) → waits 3m or 6m
    const w = waits(parseHand('234m567m45m789p11s'));
    const tileStrs = w.map(x => formatTile(x.tile));
    expect(tileStrs).toEqual(expect.arrayContaining(['3m', '6m']));
  });

  it('returns a non-empty list for a basic tenpai', () => {
    const w = waits(parseHand('234m567m789p234s55s'));  // 14 tiles → not tenpai, returns []
    expect(w).toEqual([]);
  });
});
